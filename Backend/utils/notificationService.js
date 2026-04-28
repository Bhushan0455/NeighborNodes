/**
 * Notification Service Helper
 * 
 * This is a simple background-job-ready structure for future extension.
 * Currently, it logs notifications, but it is structured so that you can easily
 * plug in a message broker (like Redis/Bull) or email service (like SendGrid/Nodemailer) later.
 */

const sendNotification = async (userId, type, message, metadata = {}) => {
    try {
        // Step 1: Format the notification payload
        const payload = {
            userId,
            type,
            message,
            metadata,
            createdAt: new Date().toISOString()
        };

        // Step 2: Queue the notification (Simulated)
        // In the future, this is where you would do:
        // await notificationQueue.add('sendEmail', payload);
        
        console.log(`[NOTIFICATION JOB QUEUED] User ID: ${userId} | Type: ${type} | Message: ${message}`);
        
        // Return true to indicate it was successfully queued
        return true;
    } catch (error) {
        console.error(`[NOTIFICATION ERROR] Failed to queue notification: ${error.message}`);
        return false;
    }
};

module.exports = { sendNotification };
