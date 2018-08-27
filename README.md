# state-master [![npm](https://img.shields.io/npm/v/state-master.svg?style=flat-square)](https://www.npmjs.com/package/state-master)

StateMaster improves react static method getDerivedStateFromProps


## Installation

### NPM

```sh
npm install --save state-master
```


## Usage

```javascript
import {Component} from 'react'
import {withStateMaster} from 'state-master';

const PROP_LIST = ['width', 'height', 'bgColor', 'fontSize'];

const INITIAL_STATE = {
  width: 1000,
  height: 500
};

class ContainerComponent extends Component {
  static displayName = 'Container';

  static getDerivedStateFromProps(data) {
    const {
        nextProps,
        prevProps,
        state,

        // the first initial call
        isInitial,

        // changed is true if one of props from PROPS_LIST was changed
        changed,
        
        // adds param "name" with given value to result state
        // add('name', value)
        // adds param "name" with value from nextProps to result state
        // add('name')
        add,

        // addIfChanged('name') or addIfChanged('name', value) the same as "if (isChanged('name')) add('name') or add('name', value)"
        addIfChanged,

        // returns true if given prop was changed somehow
        // isChanged('name') 
        // returns true if given prop was changed to given value
        // isChanged('name', value) 
        isChanged,

        // returns true if some prop from list was changed
        // isChangedAny()
        // returns true if some prop from given arguments (prop names) was changed
        // isChangedAny('width', 'height')
        isChangedAny,

        // returns true if all props from list were changed
        // isChangedAll()
        // returns true if all prop from given arguments (prop names) were changed
        // isChangedAll('width', 'height')
        isChangedAll,


        addIfChangedAny,
        call,
        get
      } = data;

      if (changed) {
        const {width, height} = nextProps;
        add('size', width + 'x' + height);
      }
      if (isChangedAny('bgColor', 'fontSize')) {
        const {bgColor, fontSize} = nextProps;
        add('style', {bgColor, fontSize});
      }
  }

  render() {
    const {style, size} = this.state;
    return (
      <div className="container" style={style}>
        Size is {size}
      </div>
    )
  }
}

export const Container = withStateMaster(ContainerComponent, PROP_LIST, INITIAL_STATE);
```

## License

MIT