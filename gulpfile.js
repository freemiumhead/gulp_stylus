var gulp = require('gulp'),
		watch = require('gulp-watch'),
		prefixer = require('gulp-autoprefixer'),
		uglify = require('gulp-uglify'),
//		sass = require('gulp-sass'),
		stylus = require('gulp-stylus'),
		sourcemaps = require('gulp-sourcemaps'),
		rigger = require('gulp-rigger'),
		cssmin = require('gulp-minify-css'),
		imagemin = require('gulp-imagemin'),
		pngquant = require('imagemin-pngquant'),
		rimraf = require('rimraf'),
		browserSync = require("browser-sync"),
		concat = require("gulp-concat"),
		jade = require('gulp-jade'),
		spritesmith = require('gulp.spritesmith'),
		merge = require('merge-stream'),
		reload = browserSync.reload;
//не обязательно делать это именно так. Существует плагин gulp-load-plugins который позволяет не писать всю эту лапшу из require.

//Указываем пути
var path = {
	build: { //Тут мы укажем куда складывать готовые после сборки файлы
		html: 'build/',
		js: 'build/js/',
		css: 'build/css/',
		img: 'build/img/',
		fonts: 'build/font/'
	},
	src: { //Пути откуда брать исходники
		jade: 'src/*.jade',
		js: 'src/js/main.js',//Указываем на наш главный js файл
		style: 'src/styles/style.styl', // //Указываем на главный файл стилей
		img: 'src/img/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
		png: 'src/img/sprite/*.png', // png для спрайтов
		fonts: 'src/font/**/*.*'
	},
	watch: { //Тут мы укажем, за изменением каких файлов мы хотим наблюдать
		jade: 'src/*.jade',
		js: 'src/js/**/*.js',
		style: 'src/styles/**/*.*',
		img: 'src/img/**/*.*',
		png: 'src/img/**/*.*',
		fonts: 'src/font/**/*.*'
	},
	clean: './build'
};

// Создадим переменную с настройками нашего dev сервера:
var config = {
	server: {
		baseDir: "./build"
	},
	tunnel: true,
	host: 'localhost',
	port: 9000,
	logPrefix: "nesteroff"
};

//Напишем таск для сборки jade:
gulp.task('jade:build', function () {
	gulp.src(path.src.jade) //Выберем файлы по нужному пути
		.pipe(jade()) // Прогоняем через компилятор и если нужно добавляем опцию для читаемости кода {pretty: true}
		.pipe(gulp.dest(path.build.html)) //Выплюнем их в папку build
		.pipe(reload({stream: true})); //И перезагрузим наш сервер для обновлений
});

//Таск по сборке скриптов будет выглядеть так:
gulp.task('js:build', function () {
	gulp.src(path.src.js) //Найдем наш main файл
//		.pipe(concat('main.js')) //склеиваем все js файлы в общий main.js
		.pipe(sourcemaps.init()) //Инициализируем sourcemap
		.pipe(uglify()) //Сожмем наш js
		.pipe(sourcemaps.write()) //Пропишем карты
		.pipe(gulp.dest(path.build.js)) //Выплюнем готовый файл в build
		.pipe(reload({stream: true})); //И перезагрузим сервер
});

//Напишем задачу для сборки нашего CSS:
gulp.task('style:build', function () {
	gulp.src(path.src.style) //Выберем наш main.scss или main.style
		.pipe(sourcemaps.init()) //То же самое что и с js
		.pipe(stylus()) //Скомпилируем
		.pipe(prefixer()) //Добавим вендорные префиксы
		.pipe(cssmin()) //Сожмем
		.pipe(sourcemaps.write()) //Пропишем карты
		.pipe(gulp.dest(path.build.css)) //И в build
		.pipe(reload({stream: true}));
});

//Таск по картинкам будет выглядеть так:
gulp.task('image:build', function () {
	gulp.src(path.src.img) //Выберем наши картинки
		.pipe(imagemin({ //Сожмем их
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()],
			interlaced: true
		}))
		.pipe(gulp.dest(path.build.img)) //И бросим в build
		.pipe(reload({stream: true}));
});

//Таск по созданию спрайтов:
gulp.task('sprite:build', function () {
	gulp.src(path.src.png) //Выберем наши картинки
	var spriteData = gulp.src('src/img/png/*.png').pipe(spritesmith({
		imgName: '../img/sprite.png',
		cssName: 'sprite.styl'
	}));

	var imgStream = spriteData.img
		.pipe(gulp.dest(path.build.img));

	var cssStream = spriteData.css
		.pipe(gulp.dest('src/styles/partials'));

	return merge(imgStream, cssStream);
});

//Шрифты
gulp.task('fonts:build', function() { // Просто кладем шрифты в build
	gulp.src(path.src.fonts)
		.pipe(gulp.dest(path.build.fonts))
});

//Запускаем все таски сразу:
gulp.task('build', [
	'jade:build',
	'js:build',
	'style:build',
	'fonts:build',
	'image:build',
	'sprite:build'
]);

//Watch. Мы просто идем по нашим путям определенным в переменной path, и в функции вызывающейся при изменении файла — просим запустить нужный нам таск.
gulp.task('watch', function(){
	watch([path.watch.jade], function(event, cb) {
		gulp.start('jade:build');
	});
	watch([path.watch.style], function(event, cb) {
		gulp.start('style:build');
	});
	watch([path.watch.js], function(event, cb) {
		gulp.start('js:build');
	});
	watch([path.watch.img], function(event, cb) {
		gulp.start('image:build');
	});
	watch([path.watch.fonts], function(event, cb) {
		gulp.start('fonts:build');
	});
});

//Таск для livereload
gulp.task('webserver', function () {
	browserSync(config);
});

//просто будет удаляться папка build.
gulp.task('clean', function (cb) {
	rimraf(path.clean, cb);
});

//дефолтный таск, который будет запускать всю нашу сборку.
gulp.task('default', ['build', 'watch', 'webserver']);
