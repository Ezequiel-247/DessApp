const { Career } = require('../models');

const careerController = {

  getAll: async (req, res) => {
    try {
      const careers = await Career.findAll();
      res.status(200).json({ data: careers });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching careers', details: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const career = await Career.findByPk(id);

      if (!career) {
        return res.status(404).json({ error: 'Career not found' });
      }

      res.status(200).json({ data: career });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching career', details: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const data = req.body;
      const payload = {
        name: data.name,
        id_institute: data.id_institute || data.instituteId,
        degree_title: data.degree_title || data.degreeTitle,
        duration: data.duration,
        code: data.code,
        description: data.description,
      };
      const newCareer = await Career.create(payload);
      res.status(201).json({ message: 'Career created successfully', data: newCareer });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Career with this code already exists' });
      }
      res.status(500).json({ error: 'Error creating career', details: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const data = req.body;
      const payload = {
        name: data.name,
        id_institute: data.id_institute || data.instituteId,
        degree_title: data.degree_title || data.degreeTitle,
        duration: data.duration,
        code: data.code,
        description: data.description,
      };

      const [updatedRows] = await Career.update(payload, { where: { id } });
      if (updatedRows === 0) {
        return res.status(404).json({ error: 'Career not found or no changes made' });
      }

      const updatedCareer = await Career.findByPk(id);
      res.status(200).json({ message: 'Career updated successfully', data: updatedCareer });
    } catch (error) {
      res.status(500).json({ error: 'Error updating career', details: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deletedRows = await Career.destroy({ where: { id } });

      if (deletedRows === 0) {
        return res.status(404).json({ error: 'Career not found' });
      }

      res.status(200).json({ message: `Career with id: ${id} deleted successfully` });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ error: 'Career with this code already exists' });
      }
      res.status(500).json({ error: 'Error updating career', details: error.message });
    }
  }
};

module.exports = careerController;
