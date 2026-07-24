const { User, Student, Admin } = require('../models'); // Corrected path to models

const userController = {
  // Helper para sanitizar el objeto de usuario (eliminar la contraseña)
  _sanitizeUser: (user) => {
    if (!user) return null;
    const rest = user.toJSON();
    delete rest.password;
    return rest;
  },

  getAll: async (req, res) => {
    try {
      const users = await User.findAll({
        include: [
          {
            model: Student,
            as: 'student', // Usamos el alias 'student' definido en User.js
          },
          {
            model: Admin,
            as: 'admin', // Usamos el alias 'admin' definido en User.js
          },
        ],
      });
      const sanitizedUsers = users.map(userController._sanitizeUser);
      res.status(200).json({ data: sanitizedUsers });
    } catch (error) {
      console.error('[UserController] Error fetching users:', error);
      res.status(500).json({ error: 'Error fetching users', details: error.message });
    }
  },

  getMe: async (req, res) => {
    // Este método normalmente usaría el usuario autenticado del token
    // Por ahora, es un placeholder.
    res.status(501).json({ error: 'Not Implemented: getMe' });
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByPk(id, {
        include: [
          { model: Student, as: 'student' },
          { model: Admin, as: 'admin' },
        ],
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ data: userController._sanitizeUser(user) });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching user', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const { password, ...userData } = req.body;
      userData.password = password;
      userData.role = userData.role || 'student';
      
      const newUser = await User.create(userData);
      res.status(201).json({ message: 'User created successfully', data: userController._sanitizeUser(newUser) });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      res.status(500).json({ error: 'Error creating user', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { password, ...updateData } = req.body;

      if (password) { updateData.password = password; }
      const [updatedRows] = await User.update(updateData, { where: { id }, individualHooks: true });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'User not found or no changes made' });
      }
      const updatedUser = await User.findByPk(id);
      res.status(200).json({ message: 'User updated successfully', data: userController._sanitizeUser(updatedUser) });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'User with this email already exists' });
      }
      res.status(500).json({ error: 'Error updating user', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await User.destroy({ where: { id } });
      if (deletedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error deleting user', details: error.message });
    }
  },

  suspend: async (req, res) => {
    try {
      const { id } = req.params;
      const [updatedRows] = await User.update(
        { is_active: false },
        { where: { id }, individualHooks: true }
      );
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const updatedUser = await User.findByPk(id);
      res.status(200).json({ 
        message: 'User suspended successfully', 
        data: userController._sanitizeUser(updatedUser) 
      });
    } catch (error) {
      res.status(500).json({ error: 'Error suspending user', details: error.message });
    }
  },

  reactivate: async (req, res) => {
    try {
      const { id } = req.params;
      const [updatedRows] = await User.update(
        { is_active: true },
        { where: { id }, individualHooks: true }
      );
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      const updatedUser = await User.findByPk(id);
      res.status(200).json({ 
        message: 'User reactivated successfully', 
        data: userController._sanitizeUser(updatedUser) 
      });
    } catch (error) {
      res.status(500).json({ error: 'Error reactivating user', details: error.message });
    }
  },
};

module.exports = userController;