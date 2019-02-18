/*

  Custom harness function for wrapping routes

*/
function customWrapper(fn, info, { logger })
{

  const log = logger('harness');
  const route = `${info.method} '${info.fullPath}'`;
  const name = `${info.routeClass}.${info.handler}`;

  log(`mapping: ${route} to ${name}`);

  return async (req, res, next) => {

    log(`route hit: ${route} ${name}`);

    try {
      const result = await fn(req, res);
      if (result) {
        res.send({ ok: true, payload: result });
      }
    }
    catch(err) {
      console.log(err);
      next(err);
    }

  };

}

module.exports = customWrapper;

