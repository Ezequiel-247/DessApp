const crypto = require('crypto');
const { Op } = require('sequelize');
const { Connection, Notification, User } = require('../models');
const {
  sendConnectionInvitationEmail,
  sendInviteeNotRegisteredEmail,
} = require('../emailService');

const connectionController = {
  getAll: async (req, res) => {
    try {
      const { userId, status } = req.query;
      const where = {};
      if (userId) {
        where[Op.or] = [
          { id_user: userId },
          { id_connected_user: userId },
        ];
      }
      if (status) where.status = status;

      const connections = await Connection.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'lastname', 'email', 'avatar'] },
          { model: User, as: 'connectedUser', attributes: ['id', 'name', 'lastname', 'email', 'avatar'] },
        ],
      });

      const parsedUserId = Number(userId);
      const response = connections.map((connection) => {
        const raw = connection.toJSON();

        if (!userId || Number.isNaN(parsedUserId)) {
          return raw;
        }

        const isRequesterSource = Number(raw.id_user) === parsedUserId;
        const counterpart = isRequesterSource ? raw.connectedUser : raw.user;

        return {
          ...raw,
          connected_user: counterpart
            ? {
                id: counterpart.id,
                full_name: `${counterpart.name || ''} ${counterpart.lastname || ''}`.trim() || 'Usuario',
                email: counterpart.email,
                profile_image: counterpart.avatar || null,
              }
            : null,
        };
      });

      res.status(200).json({ data: response });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching connections', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const connection = await Connection.findByPk(id);
      if (!connection) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      res.status(200).json({ data: connection });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching connection', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        id_user: data.id_user || data.userId,
        id_connected_user: data.id_connected_user || data.connectedUserId,
        status: data.status || 'pending',
      };
      const newConnection = await Connection.create(payload);
      res.status(201).json({ message: 'Connection created successfully', data: newConnection });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Connection already exists' });
      }
      res.status(500).json({ error: 'Error creating connection', details: error.message });
    }
  },

  inviteByEmail: async (req, res) => {
    try {
      const requester = req.user;
      const normalizedEmail = String(req.body.email || '').trim().toLowerCase();

      const invitedUser = await User.findOne({
        where: {
          email: {
            [Op.iLike]: normalizedEmail,
          },
        },
      });

      const requesterFullName = `${requester.name || ''} ${requester.lastname || ''}`.trim() || 'Un estudiante';

      if (!invitedUser) {
        await sendInviteeNotRegisteredEmail({
          to: requester.email,
          inviterName: requesterFullName,
          targetEmail: normalizedEmail,
        });

        return res.status(200).json({
          message: 'No existe un usuario registrado con ese email. Se notifico al invitador.',
          invited: false,
          reason: 'not_registered',
        });
      }

      if (Number(invitedUser.id) === Number(requester.id)) {
        return res.status(400).json({ error: 'No puedes invitarte a ti mismo' });
      }

      const existingConnection = await Connection.findOne({
        where: {
          [Op.or]: [
            {
              id_user: requester.id,
              id_connected_user: invitedUser.id,
            },
            {
              id_user: invitedUser.id,
              id_connected_user: requester.id,
            },
          ],
          status: {
            [Op.in]: ['pending', 'accepted'],
          },
        },
      });

      if (existingConnection) {
        return res.status(409).json({
          error: 'Ya existe una invitacion o conexion activa entre estos usuarios',
        });
      }

      const invitationToken = crypto.randomUUID();
      const newConnection = await Connection.create({
        id_user: requester.id,
        id_connected_user: invitedUser.id,
        status: 'pending',
        invitation_token: invitationToken,
        target_email: invitedUser.email,
      });

      await sendConnectionInvitationEmail({
        to: invitedUser.email,
        inviterName: requesterFullName,
        invitationToken,
      });

      await Notification.create({
        id_user: invitedUser.id,
        type: 'connection_request',
        title: 'Nueva invitacion de conexion',
        message: `${requesterFullName} te envio una invitacion de conexion.`,
        read: false,
      });

      return res.status(201).json({
        message: 'Invitacion enviada correctamente',
        invited: true,
        data: newConnection,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error sending invitation', details: error.message });
    }
  },

  getInvitationByToken: async (req, res) => {
    try {
      const { token } = req.params;

      const connection = await Connection.findOne({
        where: { invitation_token: token },
        include: [
          { model: User, as: 'user', attributes: ['id', 'name', 'lastname', 'email', 'avatar'] },
          { model: User, as: 'connectedUser', attributes: ['id', 'name', 'lastname', 'email', 'avatar'] },
        ],
      });

      if (!connection) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      if (Number(connection.id_connected_user) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta invitacion' });
      }

      return res.status(200).json({
        data: {
          id: connection.id,
          status: connection.status,
          target_email: connection.target_email,
          inviter: connection.user,
          invitee: connection.connectedUser,
        },
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error fetching invitation', details: error.message });
    }
  },

  respondInvitation: async (req, res) => {
    try {
      const { token } = req.params;
      const { action } = req.body;
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';

      const connection = await Connection.findOne({
        where: { invitation_token: token },
        include: [{ model: User, as: 'connectedUser', attributes: ['id', 'name', 'lastname'] }],
      });

      if (!connection) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      if (Number(connection.id_connected_user) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'No tienes permisos para responder esta invitacion' });
      }

      if (connection.status !== 'pending') {
        return res.status(409).json({ error: 'Esta invitacion ya fue respondida' });
      }

      await Connection.update(
        {
          status: newStatus,
          invitation_token: null,
        },
        {
          where: { id: connection.id },
        }
      );

      await Notification.create({
        id_user: connection.id_user,
        type: 'connection_response',
        title: 'Respuesta de invitacion',
        message:
          newStatus === 'accepted'
            ? `${req.user.name || 'El usuario'} acepto tu invitacion de conexion.`
            : `${req.user.name || 'El usuario'} rechazo tu invitacion de conexion.`,
        read: false,
      });

      const updatedConnection = await Connection.findByPk(connection.id);
      return res.status(200).json({
        message: 'Invitacion respondida correctamente',
        data: updatedConnection,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error responding invitation', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        status: data.status,
      };

      const [updatedRows] = await Connection.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Connection not found or no changes made' });
      }

      const updatedConnection = await Connection.findByPk(id);
      res.status(200).json({ message: 'Connection updated successfully', data: updatedConnection });
    } catch (error) {
      res.status(500).json({ error: 'Error updating connection', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Connection.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      res.status(200).json({ message: `Connection with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Connection already exists' });
      }
      res.status(500).json({ error: 'Error updating connection', details: error.message });
    }
  },
};

module.exports = connectionController;
