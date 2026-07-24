const { User, Admin, sequelize } = require('../models');

const adminController = {
  getAll: async (req, res) => {
    try {
      const admins = await Admin.findAll({
        include: [{ model: User, attributes: { exclude: ['password'] } }]
      });
      res.status(200).json({ data: admins });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching admins', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const admin = await Admin.findByPk(id, {
        include: [{ model: User, attributes: { exclude: ['password'] } }]
      });
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
      res.status(200).json({ data: admin });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching admin', details: error.message });
    }
  },

  create: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { email, password, name, lastname, is_active, cuil, role, id_of_creator } = req.body;

      const user = await User.create({
        email,
        password,
        name,
        lastname,
        is_active: is_active !== undefined ? is_active : true,
        role: 'admin',
      }, { transaction });

      const admin = await Admin.create({
        id_users: user.id,
        cuil,
        role,
        id_of_creator: id_of_creator || null,
      }, { transaction });

      await transaction.commit();

      const userData = user.toJSON();
      delete userData.password;

      res.status(201).json({ message: 'Admin created successfully', data: { ...userData, admin } });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email o CUIL' });
      }
      res.status(500).json({ error: 'Error creating admin', details: error.message });
    }
  },

  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { email, password, name, lastname, is_active, cuil, role } = req.body;

      const admin = await Admin.findByPk(id);
      if (!admin) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Admin not found' });
      }

      const userUpdateData = {};
      if (email !== undefined) userUpdateData.email = email;
      if (name !== undefined) userUpdateData.name = name;
      if (lastname !== undefined) userUpdateData.lastname = lastname;
      if (is_active !== undefined) userUpdateData.is_active = is_active;
      if (password) { userUpdateData.password = password; }

      if (Object.keys(userUpdateData).length > 0) {
        await User.update(userUpdateData, { where: { id: admin.id_users }, transaction, individualHooks: true });
      }

      const adminUpdateData = {};
      if (cuil !== undefined) adminUpdateData.cuil = cuil;
      if (role !== undefined) adminUpdateData.role = role;

      if (Object.keys(adminUpdateData).length > 0) {
        await Admin.update(adminUpdateData, { where: { id }, transaction });
      }

      await transaction.commit();

      const updatedAdmin = await Admin.findByPk(id, {
        include: [{ model: User, attributes: { exclude: ['password'] } }]
      });

      res.status(200).json({ message: 'Admin updated successfully', data: updatedAdmin });
    } catch (error) {
      await transaction.rollback();
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Ya existe un usuario con ese email o CUIL' });
      }
      res.status(500).json({ error: 'Error updating admin', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const admin = await Admin.findByPk(id);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      const deletedRows = await User.destroy({ where: { id: admin.id_users } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Admin not found' });
      }

      res.status(200).json({ message: `Admin with id: ${id} deleted successfully` });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting admin', details: error.message });
    }
  },
};

module.exports = adminController;
