function errorHandler(err, req, res, next) {
  console.error(err.stack);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Requête invalide', message: 'JSON mal formé' });
  }

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Une erreur interne s\'est produite',
  });
}

export default errorHandler;
