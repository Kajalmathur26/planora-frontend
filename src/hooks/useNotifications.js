import { useEffect } from 'react';
import { taskService } from '../services';
import { requestNotificationPermission, sendNotification } from '../utils/notifications';

export function useNotifications(user) {
    useEffect(() => {
        if (!user) return;

        // Ask for permission on login
        requestNotificationPermission();

        const checkTasks = async () => {
            try {
                const res = await taskService.getAll({ status: 'pending' });
                const tasks = res.data.tasks || [];
                const today = new Date().toISOString().split('T')[0];

                // Find tasks due today or overdue
                const urgentTasks = tasks.filter(t => t.due_date && t.due_date <= today);
                if (urgentTasks.length > 0) {
                    sendNotification('Task Reminder', {
                        body: `You have ${urgentTasks.length} pending task(s) due today or overdue!`,
                        requireInteraction: true
                    });
                }
            } catch (error) {
                console.error('Failed to check tasks for notifications', error);
            }
        };

        // Check initially and then every hour (3600000 ms)
        checkTasks();
        const interval = setInterval(checkTasks, 3600000);

        return () => clearInterval(interval);
    }, [user]);
}
