jest.mock('../src/models', () => ({
  Notification: {
    create: jest.fn(),
  },
  Connection: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
}), { virtual: true });

const { Notification, Connection } = require('../src/models');
const notificationService = require('../src/services/notificationService');

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createNotification crea una notificacion cuando el payload es valido', async () => {
    Notification.create.mockResolvedValue({ id: 1 });

    const result = await notificationService.createNotification({
      userId: 10,
      type: 'info',
      title: 'Titulo',
      message: 'Mensaje',
    });

    expect(Notification.create).toHaveBeenCalledWith({
      id_user: 10,
      type: 'info',
      title: 'Titulo',
      message: 'Mensaje',
      target_type: null,
      target_id: null,
      read: false,
    });
    expect(result).toEqual({ id: 1 });
  });

  test('createNotification persiste metadata de target cuando viene en el payload', async () => {
    Notification.create.mockResolvedValue({ id: 2 });

    await notificationService.createNotification({
      userId: 10,
      type: 'content_vote',
      title: 'Recibiste un like',
      message: 'Mensaje',
      targetType: 'post',
      targetId: 42,
    });

    expect(Notification.create).toHaveBeenCalledWith(expect.objectContaining({
      target_type: 'post',
      target_id: 42,
    }));
  });

  test('createNotification retorna null cuando faltan campos requeridos', async () => {
    const result = await notificationService.createNotification({
      userId: null,
      type: 'info',
      title: 'Titulo',
      message: 'Mensaje',
    });

    expect(Notification.create).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  test('createNotification retorna null si falla Notification.create', async () => {
    Notification.create.mockRejectedValue(new Error('DB error'));

    const result = await notificationService.createNotification({
      userId: 10,
      type: 'info',
      title: 'Titulo',
      message: 'Mensaje',
    });

    expect(result).toBeNull();
  });

  test('getAcceptedConnectionIds devuelve IDs conectados sin incluir el propio usuario', async () => {
    Connection.findAll.mockResolvedValue([
      { id_user: 10, id_connected_user: 20 },
      { id_user: 30, id_connected_user: 10 },
      { id_user: 10, id_connected_user: 20 },
    ]);

    const result = await notificationService.getAcceptedConnectionIds(10);

    expect(Connection.findAll).toHaveBeenCalled();
    expect(result.sort((a, b) => a - b)).toEqual([20, 30]);
  });

  test('areUsersConnected devuelve true cuando existe conexion aceptada', async () => {
    Connection.findOne.mockResolvedValue({ id: 1 });

    const result = await notificationService.areUsersConnected(10, 20);

    expect(Connection.findOne).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test('areUsersConnected devuelve false cuando no existe conexion', async () => {
    Connection.findOne.mockResolvedValue(null);

    const result = await notificationService.areUsersConnected(10, 20);

    expect(result).toBe(false);
  });
});
