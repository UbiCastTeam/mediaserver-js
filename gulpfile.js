/* globals require */
/* sudo npm install -g gulp gulp-concat gulp-minify gulp-clean-css */
var gulp = require("gulp");
var concat = require("gulp-concat");
var minify = require("gulp-minify");
var cleanCSS = require("gulp-clean-css");

gulp.task("autobuild", function() {
    gulp.watch("src/**", {ignoreInitial: false}, gulp.series("build"));
});

gulp.task("build", function() {
    gulp.src(["src/*.js"])
    .pipe(concat("dist/ms-js.js"))
    .pipe(minify({
        ext: { src: ".tmp.js", min: ".min.js" },
        compress: { hoist_vars: true }
    }))
    .pipe(gulp.dest("."));

    return gulp.src(["src/css/*.css"])
    .pipe(concat("dist/ms-js.min.css"))
    .pipe(cleanCSS({ compatibility: "ie8" }))
    .pipe(gulp.dest("."));
});
