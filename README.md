# <a href="https://framr.dev">framr.dev</a>

I wrote an <a href="https://github.com/cppshane/framr-script">FFmpeg script</a> to give the coding portions of my <a href="https://www.youtube.com/channel/UCYLo70tzoGibx13p9AjddfA">YouTube videos</a> a nice blur shadow effect. And then I realized FFmpeg was ported to WebAssembly, so it can run in the browser. And here we are.

Here is an example of what the frame looks like:

![framr-demo](https://cdn.shaneduffy.io/blog/framr-demo.gif)


Note: FFmpeg is much, much slower on the browser like this. I recommend using the <a href="https://github.com/cppshane/framr-script">original ffmpeg bash script</a> if you need to process large/many files.
