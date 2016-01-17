const gulp = require('gulp');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const livereload = require('gulp-livereload');  

const babelify = require('babelify');
const browserify = require('browserify');
const watchify = require('watchify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 9090 });


function watchCompile() {
    var bundler = watchify(browserify('src/js/app/app.js', { debug: true }).transform(babelify, {presets: ['es2015', 'react']}));

    function rebundle() {
        bundler.bundle()
        .on('error', function(err) { console.error(err); this.emit('end'); })
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true })) 
        .pipe(sourcemaps.write('./'))              
        .pipe(gulp.dest('dist/js/'));
    }

    bundler.on('update', function() {
        console.log('bundling...');
        rebundle();
        reload();
    });

    rebundle();
}


function watchChrome(){
    var files = 'src/js/chrome/**/*.js';
    gulp.watch(files, function(event){
        console.log('copying chrome files...');
        
        gulp.src(files)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist/js/'));
        reload();
    });
}

function watchHtmlCss(){
    gulp.watch('dist/**/*.+(html|css)', () => reload());
}

// signal to web socket in chrome for reloading
function reload(){
    console.log('reloading...');
    wss.clients.forEach(function each(client) {
        client.send('reload');
    });
}


gulp.task('watchCompile', () => watchCompile());
gulp.task('watchChrome',  () => watchChrome());
gulp.task('watchHtmlCss', () => watchHtmlCss());

gulp.task('default', ['watchCompile', 'watchChrome', 'watchHtmlCss']);

