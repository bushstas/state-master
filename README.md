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
import {withStateMaster, registerContext, unregisterContext} from 'state-master';

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
        // if (isInitial) { ... 
        isInitial,

        // changed is true if one of props from the PROPS_LIST was changed
        // if (changed) { ... 
        changed,
        
        // adds param "name" with given value to result state
        // add('name', value);
        // adds param "name" with value from nextProps to result state
        // add('name');
        add,

        // calls "add" method if given prop was changed somehow
        // addIfChanged('name', value);
        // addIfChanged('name');
        addIfChanged,

        // returns true if given prop was changed somehow
        // if (isChanged('name')) { ...
        // returns true if given prop was changed to given value
        // if (isChanged('name', value)) { ...
        isChanged,

        // returns true if some prop from the PROPS_LIST was changed
        // if (isChangedAny()) { ...
        // returns true if some prop from given arguments (prop names) was changed
        // if (isChangedAny('width', 'height')) { ...
        isChangedAny,

        // calls "add" method if some prop from the PROPS_LIST was changed
        // addIfChangedAny('name', value);
        // addIfChangedAny('name');
        addIfChangedAny,

        // returns true if all props from the PROPS_LIST were changed
        // if (isChangedAll()) { ...
        // returns true if all prop from given arguments (prop names) were changed
        // if (isChangedAll('width', 'height')) { ...
        isChangedAll,

        // calls function with timeout
        // the same as setTimeout(() => this.changeSomething(), 0)
        // use to do some action after component updating
        // call(() => this.update(nextProps.value));
        call,

        // returns result state or null
        // it's something about debugging, put to the end
        // console.log(get())
        // {width: '200px'}
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

  constructor(props) {
    super(props);
    // use this if you need to have this context in getDerivedStateFromProps
    registerContext(this);
  }

  componentWillUnmount() {
    // this should be done if registerContext was called
    unregisterContext(this);
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

if you have some parental component that also has getDerivedStateFromProps add one more argument

```javascript
class ContainerComponent extends ParentalComponent {
  // ...
}
export const Container = withStateMaster(ContainerComponent, PROP_LIST, INITIAL_STATE, ParentalComponent);
```

So the state from ParentalComponent will be added to Container's state and so on

## License

MIT