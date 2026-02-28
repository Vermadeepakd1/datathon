const { Router } = require("express");
const usersRouter = require("../modules/users/user.routes");
const medicalLogsRouter = require("../modules/medicalLogs/medicalLog.routes");
const diagnosticsRouter = require("../modules/diagnostics/diagnostics.routes");
const matchmakingRouter = require("../modules/matchmaking/matchmaking.routes");
const alertsRouter = require("../modules/alerts/alerts.routes");

const apiRouter = Router();

apiRouter.use("/users", usersRouter);
apiRouter.use("/medical-logs", medicalLogsRouter);
apiRouter.use("/diagnostics", diagnosticsRouter);
apiRouter.use("/matchmaking", matchmakingRouter);
apiRouter.use("/alerts", alertsRouter);

module.exports = apiRouter;
