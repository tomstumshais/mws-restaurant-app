var gulp = require('gulp');
var browserSync = require('browser-sync').create();

gulp.task('default', ['html', 'css', 'js', 'data', 'copy-images', 'pwa'], function () {
  gulp.watch('/index.html', ['html']);
  gulp.watch('./index.html').on('change', browserSync.reload);

  browserSync.init({
    server: './dist'
  });
});

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

// var browserSync = require('browser-sync').create();
//  browserSync.init({
//      server: "./"
//  });
//  browserSync.stream();