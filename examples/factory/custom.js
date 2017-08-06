/*

  Custom harness function for wrapping routes

*/
function customWrapper(fn, info)
{

  const route = `${info.method} '${info.fullPath}'`;
  const name = `${info.routeClass}.${info.handler}`;

  console.log(`[harness] mapping: ${route} to ${name}`);

  return async (req, res, next) => {

    console.log(`[harness] route hit: ${route} ${name}`);

    try {
      const result = await fn(req, res);
      if (result) {
        res.send({ ok: true, payload: result });
      }
    }
    catch(err) {
      next(err);
    }

  };

}

module.exports = customWrapper;

