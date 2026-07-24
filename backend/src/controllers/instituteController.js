const { Institute } = require('../models');

const instituteController = {

    getAll: async (req, res) => {
        try {
            const institutes = await Institute.findAll();
            res.status(200).json({ data: institutes });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching institutes', details: error.message });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const institute = await Institute.findByPk(id);
            if (!institute) {
                return res.status(404).json({ error: 'Institute not found' });
            }
            res.status(200).json({ data: institute });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching institute', details: error.message });
        }
    },

    create: async (req, res) => {
        try {
            const data = req.body;
            const newInstitute = await Institute.create(data);
            res.status(201).json({ message: 'Institute created successfully', data: newInstitute });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ error: 'Institute with this name already exists' });
            }
            res.status(500).json({ error: 'Error creating institute', details: error.message });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const [updatedRows] = await Institute.update(data, { where: { id } });
            if (updatedRows === 0) {
                return res.status(404).json({ error: 'Institute not found or no changes made' });
            }

            const updatedInstitute = await Institute.findByPk(id);
            res.status(200).json({ message: 'Institute updated successfully', data: updatedInstitute });
        } catch (error) {
            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(409).json({ error: 'Institute with this name already exists' });
            }
            res.status(500).json({ error: 'Error updating institute', details: error.message });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedRows = await Institute.destroy({ where: { id } });

            if (deletedRows === 0) {
                return res.status(404).json({ error: 'Institute not found' });
            }

            res.status(200).json({ message: `Institute with id: ${id} deleted successfully` });
        } catch (error) {
            res.status(500).json({ error: 'Error deleting institute', details: error.message });
        }
    }

};

module.exports = instituteController;
