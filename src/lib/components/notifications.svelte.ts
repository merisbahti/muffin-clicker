export type ToastType = 'danger' | 'success' | 'warning' | 'info' | 'default';

export type Toast = { id: string; type: ToastType; message: string; timeout: number };

function createNotificationStore() {
	const notificationsRune = $state<Array<Toast>>([]);

	function send(message: string, type: ToastType = 'default', timeout: number) {
		notificationsRune.push({ id: id(), type, message, timeout });
	}

	const removeNotification = (id: string) => {
		const index = notificationsRune.findIndex((x) => x.id === id);
		notificationsRune.splice(index, 1);
	};

	return {
		notificationsRune,
		removeNotification,
		send,
		default: (msg: string, timeout: number) => send(msg, 'default', timeout),
		danger: (msg: string, timeout: number) => send(msg, 'danger', timeout),
		warning: (msg: string, timeout: number) => send(msg, 'warning', timeout),
		info: (msg: string, timeout: number) => send(msg, 'info', timeout),
		success: (msg: string, timeout: number) => send(msg, 'success', timeout)
	};
}

function id() {
	return '_' + Math.random().toString(36).substr(2, 9);
}

export const notificationsStore = createNotificationStore();
