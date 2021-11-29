/* globals require */
/* sudo npm install -g gulp gulp-concat gulp-minify gulp-clean-css */
const gulp = require('gulp');
const concat = require('gulp-concat');
const minify = require('gulp-minify');
const cleanCSS = require('gulp-clean-css');

gulp.task('autobuild', function () {
    gulp.watch('src/**', {ignoreInitial: false}, gulp.series('build'));
});

gulp.task('build', function () {
    /* build api + trans */
    gulp.src([
        'dist/locales/*.js',
        'src/ms-api.js'
    ])
        .pipe(concat('dist/ms-api.js'))
        .pipe(minify({
            ext: { src: '.tmp.js', min: '.min.js' },
            compress: { 'hoist_vars': true }
        }))
        .pipe(gulp.dest('.'));

    /* build tree */
    gulp.src([
        'src/ms-tree.js'
    ])
        .pipe(concat('dist/ms-tree.js'))
        .pipe(minify({
            ext: { src: '.tmp.js', min: '.min.js' },
            compress: { 'hoist_vars': true }
        }))
        .pipe(gulp.dest('.'));

    /* build browser */
    gulp.src([
        'src/ms-browser*.js'
    ])
        .pipe(concat('dist/ms-browser.js'))
        .pipe(minify({
            ext: { src: '.tmp.js', min: '.min.js' },
            compress: { 'hoist_vars': true }
        }))
        .pipe(gulp.dest('.'));

    /* build browser + tree + api + trans */
    gulp.src([
        'dist/locales/*.js',
        'src/*.js'
    ])
        .pipe(concat('dist/ms-full.js'))
        .pipe(minify({
            ext: { src: '.tmp.js', min: '.min.js' },
            compress: { 'hoist_vars': true }
        }))
        .pipe(gulp.dest('.'));

    /* build MS specific css */
    gulp.src(['src/css/ms-catalog.css'])
        .pipe(concat('dist/ms-catalog.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('.'));

    /* build items css */
    gulp.src(['src/css/ms-items.css'])
        .pipe(concat('dist/ms-items.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('.'));

    /* build browser css */
    gulp.src(['src/css/ms-browser.css'])
        .pipe(concat('dist/ms-browser.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('.'));

    /* build browser + items css (excluding catalog css) */
    return gulp.src(['src/css/ms-items.css', 'src/css/ms-browser.css'])
        .pipe(concat('dist/ms-full.min.css'))
        .pipe(cleanCSS({ compatibility: 'ie8' }))
        .pipe(gulp.dest('.'));
});
