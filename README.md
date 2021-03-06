# state-master [![npm](https://img.shields.io/npm/v/state-master.svg?style=flat-square)](https://www.npmjs.com/package/state-master)

StateMaster improves React's methods getDerivedStateFromProps and componentDidUpdate


## Installation

### NPM

```sh
npm install --save state-master
```


## Usage

```javascript
import {Component} from 'react'
import {withStateMaster, registerContext, unregisterContext} from 'state-master';

const PROP_LIST = ['width', 'height', 'bgColor', 'fontSize', 'autoSize'];
// or if just one prop
const PROP_LIST = 'value';

// adding initial state is conditional
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
        isInitial,
        changed,
        changedProps,
        isChanged,
        add,
        addIfChanged,
        isChangedAny,
        addIfChangedAny,
        isChangedAll,
        call,
        get
      } = data;

      // the first initial call
      if (isInitial) {
        // adds param "name" with given value to result state
        add('name', value);
        // adds param "name" with value from nextProps to result state
        add('name');        
      }

      // changedProps is an array which contains all changed prop names
      if (changedProps.indexOf('value') !== -1) {
        add('value'); 
      }

      // returns true if given prop was changed somehow
      if (isChanged('autoSize')) {
        add('autoSize');
      }      
      // returns true if given prop was changed to given value      
      if (isChanged('autoSize', true)) {
        add('autoSize', true);
      }

      // changed is true if one of props from the PROPS_LIST was changed
      if (changed) {
        add('somethingChanged', true);
      }

      // returns true if some prop from the PROPS_LIST was changed
      // the same as "changed"
      if (isChangedAny()) {
         add('somethingChanged', true);
      }
      
      // returns true if some prop from given arguments (prop names) was changed
      if (isChangedAny('bgColor', 'fontSize')) {
        const {bgColor, fontSize} = nextProps;
        add('style', {backgroundColor: bgColor, fontSize});
      }

      // returns true if all props from the PROPS_LIST were changed
      if (isChangedAll()) {
        add('allChanged', true);
      }

      // calls "add" method if given prop was changed
      addIfChanged('name', value);
      addIfChanged('name');

      // calls "add" method if some prop from the PROPS_LIST was changed
      addIfChangedAny('name', value);
      addIfChangedAny('name');
      
      // returns true if all prop from given arguments (prop names) were changed        
      if (isChangedAll('width', 'height')) {
        const {width, height} = nextProps;
        add('size', width + 'x' + height);
        
        // calls function with timeout
        // the same as setTimeout(() => this.changeSomething(), 0)
        // use to do some action after component updating
        call(() => {
          this.initNewSizes(width, height);
        });
      }
      
      // returns result state or null      
      // it's something about debugging, put to the end
      console.log(get());

      // or you can just return state changes as usually
      return {
        size: nextProps.width + 'x' + nextProps.height
      }
  }

  constructor(props) {
    super(props);
    // use "registerContext" if you need to have this context in getDerivedStateFromProps
    registerContext(this);
  }

  componentDidUpdate(data) {
    const {
        prevProps,
        prevState,
        snapshot,
        changedProps,
        changed,
        isChanged,
        isChangedAny,
        isChangedAll
      } = data;

      if (isChanged('value')) {
        const {value} = this.props;
        this.doSomeAction(value);
      }
  }

  componentWillUnmount() {
    // this should be done if "registerContext" was called
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

If you have some parental component that also has getDerivedStateFromProps add one more argument

```javascript
class ContainerComponent extends ParentalComponent {
  // ...
}
export const Container = withStateMaster(ContainerComponent, PROP_LIST, null, ParentalComponent);
```

So the state from ParentalComponent will be added to Container's state and so on