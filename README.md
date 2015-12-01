# frontend-scaffold-csssplit
Have you ever found you self in a position where some of your SCSS didn't quite work as intended in IE8/9? Or some SCSS is actually missing in the compiled css in the browser?

Then you might have hit the hidden wall - you have reached more than 4095 seletors and therefore ie can't read em. 
But fear not my good sir, i have an easy solution prepared for you to use. 

# How to use
The plugin is designed to work in tandem with frontend-scaffold (https://github.com/dwarfhq/frontend-scaffold) but should be possible to use in a standalone solution also.

Start by adding the plugin to your solution:
```
npm install twixier/frontend-scaffold-csssplit --save-dev
```

NPM will now install the plugin and its dependencies.

** Configuration **
As per 1.0.3 version we have two settings you can parse to the plugin
- match {string}
If you have multiple files comming down your stream CSSSplit will go through each one and test if it should be splitted. If you provide a string with a partial filename we will try to match it to one of thoose files in the stream and only test that one.

- path {string} 
When we're splitting a stylesheet into pieces we have to store our @import files somewhere. We're always working under the assumption that it should be stored as closest to your "normal" stylesheet - therefore if you don't set path, we fallback to "ie-partials".

** A simple example ** 
```
gulp.task('compile:css', function () {
  return gulp.src(['./stylesheet/main.scss', './stylesheet/mobile.scss'])
         .pipe(sass())
         .on('error', onError)
         .pipe(autoprefixer(mod.autoprefixer))
         .pipe(minifyCss())
         .pipe(gulp.dest('.'))
         .on('error', onError)
         .pipe(csssplit({
            path: "old-browsers",
            match: "main"
         }))
         .pipe(bs.reload({ stream: true }))
});
```
