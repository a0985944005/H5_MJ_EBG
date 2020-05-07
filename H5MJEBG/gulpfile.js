var gulp = require('gulp')
var fileInline = require('gulp-file-inline')
var gulpSequence = require('gulp-sequence')
var gzip = require('gulp-gzip')
var htmlmin = require('gulp-htmlmin')

gulp.task('gzip', function (cb) {
    gulp.src(['./dist/**/*.json', './dist/**/*.js', './dist/**/*.html'])
        .pipe(gzip({
            level: 9,
            append: false
        }))
        .pipe(gulp.dest('./dist/'))
        .on('end', cb);
})

gulp.task('inline', function (cb) {
    gulp.src('./dist/web-mobile/index.html')
        .pipe(fileInline())
        .pipe(htmlmin({
            collapseWhitespace:true,
            removeComments: true
        }))
        .pipe(gulp.dest('./dist/web-mobile/'))
        .on('end', cb);
})

gulp.task('to-dist', function (cb) {
    gulp.src('./build/**/*')
        .pipe(gulp.dest('./dist/'))
        .on('end', cb);
})

gulp.task('default', gulpSequence('to-dist', ['inline', 'gzip']));
