REACT VFX is a component library. It allows you to add powered effects to your application. You can easily add
glitched images,
stylized videos
and
shiny texts
to your website!!

Examples
Add effects to your images!!

⚡Animated GIFs are also supported!!⚡

Videos work well!
You can also add effects to
plain text!!!!!
Install
npm i react-vfx
See GitHub for more info.

Usage
REACT-VFX consists of VFX Provider and VFX Elements.

First, wrap your entire app with <VFXProvider>.

import { VFXProvider } from 'react-vfx';

function App {
return (
<VFXProvider>
{/_ Place your app here _/}
</VFXProvider>
);
}

Then you can use VFX Elements anywhere in you app. Use <VFXImg>, <VFXVideo> or <VFXSpan> instead of <img>, <video> or <span>.

VFX Elements have shader property. etc. All available shaders are listed here.

import { VFXImg } from 'react-vfx';

function Component {
return (
<VFXImg
      src="react-logo.png"
      shader="rainbow"/>
);
}

Image
Use <VFXImg> instead of <img>.

import { VFXImg } from 'react-vfx';

<VFXImg src="react-logo.png" shader="rainbow"/>

// or add attributes
<VFXImg
  src="react-logo.png"
  alt="React Logo"
  shader="rainbow"/>


Video
Use <VFXVideo> instead of <video>.

import { VFXVideo } from 'react-vfx';

<VFXVideo src="mind_blown.mp4" shader="halftone"/>


Text
Use <VFXSpan> instead of <span>.

import { VFXSpan } from 'react-vfx';

<VFXSpan>Hello world!</VFXSpan>
<VFXSpan> automatically re-renders when its content is updated.



Div (experimental)
REACT-VFX also has VFXDiv, which allow us to wrap any elements...
so you can make an interactive form with WebGL effects!!




Custom Shaders
You can use your own shader in REACT-VFX.

import { VFXSpan } from 'react-vfx';

const blink = `
uniform vec2 resolution; // Resolution of the element
uniform vec2 offset; // Position of the element in the screen
uniform float time; // Time passed since mount
uniform sampler2D src; // Input texture
out vec4 outColor;

void main() {
// Get UV in the element
vec2 uv = (gl_FragCoord.xy - offset) / resolution;

    outColor = texture(src, uv) * step(.5, fract(time));

}
`;

export default = () => (
<VFXSpan shader={blink}>I'm blinking!</VFXSpan>
);



Transition
REACT-VFX provides a uniform variable float enterTime; to write transition effects.

import { VFXSpan } from 'react-vfx';

const fadeIn = `
uniform vec2 resolution;
uniform vec2 offset;
uniform float time;
uniform float enterTime; // Time since entering the viewport
uniform sampler2D src;
out vec4 outColor;

void main() {
vec2 uv = (gl_FragCoord.xy - offset) / resolution;
outColor = texture(src, uv);

    // Fade alpha by enterTime
    outColor.a *= smoothstep(0.0, 3.0, enterTime);

}
`;

export default = () => (
<VFXSpan shader={fadeIn}>I'm fading!</VFXSpan>
);


Custom Uniforms
REACT-VFX accepts custom uniform variables as `uniforms`. You can pass objects of parameters or functions:

// dictionary of parameters or functions
export type VFXUniforms = {
[name: string]: VFXUniformValue | (() => VFXUniformValue);
};

// REACT-VFX currently supports float, vec2, vec3 and vec4.
export type VFXUniformValue =
| number // float
| [number, number] // vec2
| [number, number, number] // vec3
| [number, number, number, number]; // vec4
If a parameter frequently changes over time (e.g. scroll position), consider passing it as a function than a native value to avoid performance problem.

import { VFXSpan } from 'react-vfx';

const scrollByScroll = `
uniform vec2 resolution;
uniform vec2 offset;
uniform float scroll; // custom uniform passed as props
uniform sampler2D src;
out vec4 outColor;

void main() {
vec2 uv = (gl_FragCoord.xy - offset) / resolution;

    // scroll X by scroll
    uv.x = fract(uv.x + scroll * 30.);

    // prevent vertical overflow
    if (uv.y < 0. || uv.y > 1.) discard;

    outColor = texture(src, uv);

}
`;

export default = () => (
<VFXSpan shader={scrollByScroll} uniforms={{
        scroll: () => window.scrollY / (document.body.scrollHeight - window.innerHeight);
    }}>I'm blinking!</VFXSpan>
);

