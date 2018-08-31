// The @types/jdenticon is out of date and creating new definitions
// for jdenticon is difficult due to it's structure, so for the time
// being lets just wrap it.
const jdenticon = require('jdenticon/dist/jdenticon');

interface Config {
  hues?: null | number[];
  lightness?: {
    color?: number[];
    grayscale?: number[];
  };
  saturation?: {
    color?: number;
    grayscale?: number;
  };
  backColor?: string;
  replaceMode?: 'never' | 'once' | 'observe';
}

class Jdenticon {
  get config(): Config {
    return jdenticon.config as Config;
  }
  set config(val: Config) {
    jdenticon.config = val;
  }

  update(el: Element, hash?: string, padding?: number) {
    jdenticon.update(el, hash, padding);
  }
}

export default new Jdenticon();
