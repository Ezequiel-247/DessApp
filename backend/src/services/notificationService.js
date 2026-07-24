const { Op } = require('sequelize');
const { Notification, Connection } = require('../models');

async function createNotification({ userId, type, title, message, targetType = null, targetId = null }) {
  if (!userId || !type || !title || !message) {
    return null;
  }

  const hasTargetId = targetId !== null && targetId !== undefined && String(targetId).trim() !== '';
  const parsedTargetId = hasTargetId ? Number(targetId) : null;

  try {
    return await Notification.create({
      id_user: userId,
      type,
      title,
      message,
      target_type: targetType || null,
      target_id: parsedTargetId === null || Number.isNaN(parsedTargetId) ? null : parsedTargetId,
      read: false,
    });
  } catch (error) {
    console.error('Error creating internal notification:', error);
    return null;
  }
}

async function getAcceptedConnectionIds(userId) {
  if (!userId || !Connection) {
    return [];
  }

  try {
    const connections = await Connection.findAll({
      where: {
        status: 'accepted',
        [Op.or]: [
          { id_user: userId },
          { id_connected_user: userId },
        ],
      },
      attributes: ['id_user', 'id_connected_user'],
    });

    const contactIds = new Set();
    connections.forEach((connection) => {
      const userA = Number(connection.id_user);
      const userB = Number(connection.id_connected_user);

      if (!Number.isNaN(userA) && userA !== Number(userId)) {
        contactIds.add(userA);
      }
      if (!Number.isNaN(userB) && userB !== Number(userId)) {
        contactIds.add(userB);
      }
    });

    return Array.from(contactIds);
  } catch (error) {
    console.error('Error fetching accepted connections:', error);
    return [];
  }
}

async function areUsersConnected(userAId, userBId) {
  if (!userAId || !userBId || Number(userAId) === Number(userBId) || !Connection) {
    return false;
  }

  try {
    const connection = await Connection.findOne({
      where: {
        status: 'accepted',
        [Op.or]: [
          { id_user: userAId, id_connected_user: userBId },
          { id_user: userBId, id_connected_user: userAId },
        ],
      },
      attributes: ['id'],
    });

    return Boolean(connection);
  } catch (error) {
    console.error('Error checking users connection:', error);
    return false;
  }
}

module.exports = {
  createNotification,
  getAcceptedConnectionIds,
  areUsersConnected,
};
