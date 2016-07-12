/**
 * Created by Jxsty 2/6/16.
 */
var path = require('path');
var gulp = require('gulp');
var sass = require('gulp-ruby-sass');
var autoprefixer = require('gulp-autoprefixer');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var jade = require('gulp-jade');
var data = require('gulp-data');
var del = del = require('del');
var notify = require('gulp-notify');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var gutil = require('gulp-util');


gulp.task('default', ['xxx'], function () {
    gulp.start('copy');
});

gulp.task('xxx', ['clean'], function () {
    gulp.start('styles', 'images', 'html');
});

gulp.task('clean', function () {
    return del(['dist']);
});

gulp.task('styles', function () {
    return sass('src/sass/*.scss', {style: 'expanded'})
        .pipe(autoprefixer('last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'))
        .pipe(gulp.dest('dist/css'))
        .pipe(rename({suffix: '.min'}))
        .pipe(minifycss())
        .pipe(gulp.dest('dist/css'))
        .pipe(notify({message: 'Styles task complete'}));
});

//template
gulp.task('html', function () {
    return gulp.src('src/views/page/**/*.jade')
        .pipe(data(function (file) {
            //path.basename(file.path)
            var fileName = file.path;
            var pos = fileName.indexOf('.jade');
            var name = fileName.substr(0, pos);
            console.log(name);
            return require(name + '.json');
        }))
        .pipe(jade({
            pretty: true
        }))
        .pipe(gulp.dest('dist'));
});

gulp.task('images', function () {
    //TODO fix imagemin error
    return gulp.src('src/images/**/*.*')
        .pipe(gulp.dest('dist/images'));
    //return gulp.src('src/images/**/*')
    //    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    //    .pipe(gulp.dest('dist/images'))
    //    .pipe(notify({ message: 'Images task complete' }));
});

gulp.task('copy', function () {
    gulp.src('src/lib/**/*.*')
        .pipe(gulp.dest('dist/lib'));
    gulp.src('src/js/**/*.*')
        .pipe(gulp.dest('dist/js'));
});

gulp.task('watch', function () {
    gulp.watch('src/sass/**/*.scss', ['styles']);
    gulp.watch('src/views/**/*.{jade,json}', ['html']);
    gulp.watch('src/js/**/*.js', ['html','copy']);
    gulp.watch('src/images/**/*', ['images']);
    //gulp.watch(['dist/**']).on('change', livereload.changed);
});

gulp.task('deploy',function(){
    gulp.src('dist/**/*.*')
        .pipe(gulp.dest('src/web'));
});


gulp.task('copy-css',function(){
    gulp.src('dist/css/*.*')
        .pipe(gulp.dest('src/web/css'));
});
