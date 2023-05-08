"use strict"

const browserSync = require('browser-sync')
const {src, dest} = require('gulp')
const gulp = require('gulp')
const scss = require('gulp-sass')(require('sass'))
const rename = require('gulp-rename')
const rigger = require('gulp-rigger')
const panini = require('panini')
const del = require('del')
const uglify = require('gulp-uglify')
const cssnano = require('gulp-cssnano')
const imagemin = require('gulp-imagemin')
const plumber = require('gulp-plumber')
const cssbeauty = require('gulp-cssbeautify')
const removeComment = require('gulp-strip-css-comments')
const autoprefixer = require('gulp-autoprefixer')
const notify = require('gulp-notify')
const browsersync = require('browser-sync').create()

const srcPath = "src/"
const distPath = "dist/"

const path = {
    build: {
        html: distPath,
        css: distPath + "assets/css",
        js: distPath + "assets/js",
        images: distPath + "assets/images",
        fonts: distPath + "assets/fonts"
    },
    src: {
        html: srcPath + "*.html",
        css: srcPath + "assets/scss/" + "*.scss",
        js: srcPath + "assets/js/" + "*.js",
        images: srcPath + "assets/images/**/" + "*.{jpeg, jpg, png, svg, webp, gif, ico, xml, json}",
        fonts: srcPath + "assets/fonts/**/" + "*.{eot, woff, woff2, svg, ttf}"
    },
    watch: {
        html: srcPath + "**/*.html",
        css: srcPath + "assets/scss/**/" + "*.scss",
        js: srcPath + "assets/js/**/" + "*.js",
        images: srcPath + "assets/images/**/" + "*.{jpeg, jpg, png, svg, webp, gif, ico, xml, json}",
        fonts: srcPath + "assets/fonts/**/" + "*.{eot, woff, woff2, svg, ttf}"
    },
    clean: "./" + distPath
}

function server() {
    browsersync.init(
        {
            server: {
                baseDir: './' + distPath
            }
        }
    )
}

function html() {
    panini.refresh()
    return src(path.src.html, { base: srcPath })
        .pipe(plumber())
        .pipe(panini(
            {
                root: srcPath,
                layouts: srcPath + "template/layouts",
                partials: srcPath + "template/partials"
            }
        ))
        .pipe(dest(path.build.html))
        .pipe(browsersync.reload({stream: true}))
}

function css() {
    return src(path.src.css, { base: srcPath + "assets/scss" })
        .pipe(plumber(
            {
                errorHandler: function(err) {
                    notify.onError(
                        {
                            title: "SCSS error",
                            message: "Error: <%= error.message %>"
                        }
                    )(err)
                    this.emit('end')
                }
            }
        ))
        .pipe(scss()) 
        .pipe(autoprefixer())
        .pipe(cssbeauty())
        .pipe(dest(path.build.css))
        .pipe(cssnano(
            {
                zindex: false,
                discardComments: {
                    removeAll: true,
                }
            }
        ))
        .pipe(removeComment())
        .pipe(rename(
            {
                suffix: '.min',
                extname: '.css'
            }
        ))
        .pipe(dest(path.build.css))
        .pipe(browsersync.reload({stream: true}))
}

function js() {
    return src(path.src.js, { base: srcPath + "assets/js" })
        .pipe(plumber(
            {
                errorHandler: function(err) {
                    notify.onError(
                        {
                            title: "SCSS error",
                            message: "Error: <%= error.message %>"
                        }
                    )(err)
                    this.emit('end')
                }
            }
        ))
        .pipe(rigger())
        .pipe(dest(path.build.js))
        .pipe(uglify())
        .pipe(rename(
            {
                suffix: '.min',
                extname: '.js'
            }
        ))
        .pipe(dest(path.build.js))
        .pipe(browsersync.reload({stream: true}))
}

function images() {
    return src(path.src.images, { base: srcPath + "assets/images" })
        .pipe(imagemin(
            [
                imagemin.gifsicle({interlaced: true}),
                imagemin.mozjpeg({quality: 75, progressive: true}),
                imagemin.optipng({optimizationLevel: 5}),
                imagemin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ]
        ))
        .pipe(dest(path.build.images))
        .pipe(browsersync.reload({stream: true}))
}

function fonts() {
    return src(path.src.fonts, { base: srcPath + "assets/fonts" })
        .pipe(browsersync.reload({stream: true}))
}

function clean() {
    return del(path.clean)
}

function watcher() {
    gulp.watch([path.watch.html], html)
    gulp.watch([path.watch.css], css)
    gulp.watch([path.watch.js], js)
    gulp.watch([path.watch.images], images)
    gulp.watch([path.watch.fonts], fonts)
}

const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts))
const watch = gulp.parallel(build, watcher, server)

exports.html = html
exports.css = css
exports.js = js
exports.images = images
exports.fonts = fonts
exports.clean = clean
exports.build = build
exports.watch = watch
exports.default = watch