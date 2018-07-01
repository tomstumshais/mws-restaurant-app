var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify-css');

gulp.task('js', function () {
  gulp.src('js/*.js')
    .pipe(concat('bundle.js'))
    .pipe(uglify())
    .pipe(gulp.dest('build/js/'));
});

gulp.task('css', function () {
  gulp.src('css/*.css')
    .pipe(concat('styles.css'))
    .pipe(minify())
    .pipe(gulp.dest('build/css/'));
});

gulp.task('default', ['js', 'css'], function () {});

// TODO: useful resources about Gulp
// https://www.tutorialspoint.com/gulp/gulp_developing_application.htm
// https://css-tricks.com/gulp-for-beginners/
// https://www.youtube.com/watch?v=1rw9MfIleEg

/*var gulp = require('gulp');
var uglify = require('gulp-uglify');
var browserSync = require('browser-sync').create();

gulp.task('html', function () {
  gulp.src('./*.html').pipe(gulp.dest('./dist'));
});

gulp.task('css', function () {
  gulp.src('css/*').pipe(gulp.dest('./dist/css'));
});

gulp.task('js', function () {
  gulp.src('js/*').pipe(gulp.dest('./dist/js'));
  gulp.src('sw.js').pipe(gulp.dest('./dist'));
});

gulp.task('data', function () {
  gulp.src('data/*').pipe(gulp.dest('./dist/data'));
});

gulp.task('pwa', function () {
  gulp.src('manifest.json').pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function () {
  gulp.src('img/*').pipe(gulp.dest('dist/img'));
  gulp.src('img/icons/*').pipe(gulp.dest('dist/img/icons'));
});

// default task for gulp command
gulp.task('default', ['html', 'css', 'js', 'data', 'copy-images', 'pwa'], function () {
  browserSync.init({
    server: './dist'
  });

  gulp.watch('/index.html', ['html']);
  gulp.watch('*.html').on('change', browserSync.reload);
});*/