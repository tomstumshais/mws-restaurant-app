var gulp = require('gulp');
var browserSync = require('browser-sync').create();

gulp.task('default', ['copy-html', 'copy-images'], function() {
  gulp.watch('/index.html', ['copy-html']);
  gulp.watch('./index.html').on('change', browserSync.reload);

  browserSync.init({
    server: './dist'
  });
});

gulp.task('copy-html', function() {
  gulp.src('./index.html').pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
  gulp.src('img/*').pipe(gulp.dest('dist/img'));
});

// var browserSync = require('browser-sync').create();
//  browserSync.init({
//      server: "./"
//  });
//  browserSync.stream();
