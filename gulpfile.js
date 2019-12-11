/* globals require */
/* sudo npm install -g gulp gulp-concat gulp-minify gulp-clean-css */
var gulp = require('gulp');
var concat = require('gulp-concat');
var minify = require('gulp-minify');
var cleanCSS = require('gulp-clean-css');

gulp.task('autobuild', function() {
    gulp.watch('src/**', {ignoreInitial: false}, gulp.series('build'));
});

gulp.task('build', function() {
    /* build browser + api + tree */
    gulp.src(['src/*.js'])
    .pipe(concat('dist/ms-browser.js'))
    .pipe(minify({
        ext: { src: '.tmp.js', min: '.min.js' },
        compress: { hoist_vars: true }
    }))
    .pipe(gulp.dest('.'));

    /* build api */
    gulp.src([
        'src/ms-trans-fr.js',
        'src/ms-api.js'
    ])
    .pipe(concat('dist/ms-api.js'))
    .pipe(minify({
        ext: { src: '.tmp.js', min: '.min.js' },
        compress: { hoist_vars: true }
    }))
    .pipe(gulp.dest('.'));

    /* build tree */
    gulp.src([
        'src/ms-trans-fr.js',
        'src/ms-tree.js'
    ])
    .pipe(concat('dist/ms-tree.js'))
    .pipe(minify({
        ext: { src: '.tmp.js', min: '.min.js' },
        compress: { hoist_vars: true }
    }))
    .pipe(gulp.dest('.'));

    return gulp.src(['src/css/*.css'])
    .pipe(concat('dist/ms-browser.min.css'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('.'));
});
