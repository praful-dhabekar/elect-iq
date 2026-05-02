const errorHandler = (err, req, res, next) => {
  console.error(JSON.stringify({
    severity: 'ERROR',
    message: err.message,
    path: req.path,
    method: req.method,
  }));
  res.status(500).json({ error: 'Internal server error' });
};

module.exports = errorHandler;
