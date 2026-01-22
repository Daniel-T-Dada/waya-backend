import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import uploadRoutes from './upload';
import childrenRoutes from './children';
import walletRoutes from './wallet';
import taskmasterRoutes from './taskmaster';
import chorequestRoutes from './chorequest';
import goalgetterRoutes from './goalgetter';
import notificationRoutes from './notifications';
import moneymazeRoutes from './moneymaze';
import insighttrackerRoutes from './insighttracker';
import settingsRoutes from './settings';
import parentDashboardRoutes from './parentDashboard';
import childDashboardRoutes from './childDashboard';
import monitoringRoutes from './monitoring';
import paymentRoutes from './payment';

const router = Router();

router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/uploads', uploadRoutes);
router.use('/children', childrenRoutes);
router.use('/familywallet', walletRoutes);
router.use('/taskmaster', taskmasterRoutes);
router.use('/chorequest', chorequestRoutes);
router.use('/goalgetter', goalgetterRoutes);
router.use('/notifications', notificationRoutes);
router.use('/moneymaze', moneymazeRoutes);
router.use('/insighttracker', insighttrackerRoutes);
router.use('/settings_waya', settingsRoutes);
router.use('/parent', parentDashboardRoutes);
router.use('/child', childDashboardRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/payments', paymentRoutes);

export default router;
