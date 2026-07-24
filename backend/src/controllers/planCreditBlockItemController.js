const { PlanCreditBlockItem, PlanCreditBlock, Activity } = require('../models');

const planCreditBlockItemController = {
  getAll: async (req, res) => {
    try {
      const items = await PlanCreditBlockItem.findAll({
        include: [
          { model: PlanCreditBlock, attributes: ['id', 'id_study_plan'] },
          { model: Activity, attributes: ['id', 'name'] },
        ],
      });
      const flat = items.map((item) => {
        const plain = item.get({ plain: true });
        return {
          id: plain.id,
          id_credit_block: plain.id_credit_block,
          id_activity: plain.id_activity,
          credits: plain.credits,
          id_study_plan: plain.PlanCreditBlock?.id_study_plan ?? null,
          activity: plain.Activity,
        };
      });
      res.status(200).json({ data: flat });
    } catch (error) {
      res.status(500).json({ error: 'Error fetching plan credit block items', details: error.message });
    }
  },
};

module.exports = planCreditBlockItemController;
