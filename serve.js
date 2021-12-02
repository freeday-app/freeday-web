/*
We use this mini express server to serve the app while being able to
retreive environment variables at runtime
Environment variables passed at runtime are catched here and injected
in the window object using the small javascript script in index.html
This trick allows to change the environment variables without
having to rebuild the app and therefore rebuild the docker image
*/
import Express from 'express';
import Ejs from 'ejs';
import Path from 'path';

const app = Express();

const currentDir = Path.resolve();
const buildDir = Path.join(currentDir, './build');

const {
    API_PUBLIC_URL
} = process.env;

app.set('views', buildDir);

app.engine('html', Ejs.renderFile);

app.use('/static', Express.static(
    Path.join(buildDir, '/static')
));

app.get('*', (req, res) => {
    res.render('index.html', {
        API_PUBLIC_URL
    });
});

const port = 8788;
app.listen(port, () => {
    console.log(`Serving Freeday front on port ${port}`);
});
