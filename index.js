const modObject = (key, value, obj) => {
	if (!obj || !(obj instanceof Object)) {
		obj = {};
	}
	obj[key] = value;
	return obj;
}

const check = function(key) {
	if (typeof key == 'string') {
		const isChanged = this.isPropChanged(key);
		if (isChanged) {
			savePrevProp.call(this, key);
		}
		return isChanged;
	} else if (key instanceof Array) {
		let isChanged = false;
		for (let i = 0; i < key.length; i++) {
			if (check.call(this, key[i])) {
				savePrevProp.call(this, key[i]);
				isChanged = true
			}
		}
		return isChanged;
	}
}

const savePrevProp = function(key) {
	if (!this.newState) {
		this.newState = {};
	}
	if (!this.newState.prevProps) {
		this.newState.prevProps = this.prevProps;
	}
	this.newState.prevProps[key] = this.props[key];
	this.changed = this.changed || {};
	this.changed[key] = true;
}

const UNIQUE_ID = '__uniqCmpID';
const SUBSCRIBERS = {};
let ID = 0;
let CURRENT_ID = 0;
const getNextId = function() {
	return ID++;
}

export const subscribeToStateMaster = (cmp) => {
	CURRENT_ID = getNextId();
	SUBSCRIBERS[CURRENT_ID] = cmp;
	cmp.state = cmp.state || {};
}

export const unsubscribeFromStateMaster = (cmp) => {
	const id = cmp.state[UNIQUE_ID];
	SUBSCRIBERS[id] = null;
	delete SUBSCRIBERS[id];
}

class StateMaster {
	constructor(propsList, initialState = null) {
		this.propsList = propsList;
		this.initialState = initialState;
	}

	getDerivedState = (props, state, callback) => {
		this.prevProps = state.prevProps || {};
		this.props = props;
		this.newState = null;
		this.changed = null;
		this.id = state[UNIQUE_ID];
		const isInitial = this.id == null;
		if (isInitial) {
			this.id = CURRENT_ID;
			this.newState = {[UNIQUE_ID]: CURRENT_ID};
			if (this.initialState instanceof Object) {
				this.newState = {
					...this.initialState,
					...this.newState
				};
			}
		}
		const instance = SUBSCRIBERS[this.id];		
		
		let parent;
		if (instance) {
			parent = instance.__proto__;
		}
		check.call(this, this.propsList);
		let parentalState;
		// if (parent instanceof Object) {			
		// 	parent = parent.constructor.__proto__;
		// 	if (false) {
		// 		parentalState = parent.getDerivedStateFromProps(props, state);				
		// 	}
		// }
		if ((isInitial || this.changed || parentalState) && typeof callback == 'function') {
			const data = {
				nextProps: props,
				prevProps: this.prevProps,
				state,
				propsList: this.propsList,
				add: this.add,
				addIfChanged: this.addIfChanged,
				isChanged: this.isChanged,
				isChangedAny: this.isChangedAny,
				addIfChangedAny: this.addIfChangedAny,
				isChangedAll: this.isChangedAll,
				get: this.get,
				call: this.call,
				isInitial
			}
			callback.call(instance, data);
			if (parentalState) {
				this.merge(parentalState);
			}
			return this.newState;
		}
		return null;
	}

	isPropChanged = (key) => {
		return this.prevProps[key] !== this.props[key];
	}

	isChanged = (key, value = undefined) => {
		return this.changed && this.changed[key] && (value === undefined || this.newState.prevProps[key] === value);
	}

	addIfChangedAny = (key, value = undefined) => {
		if (this.isChangedAny()) {
			this.add(key, value);
		}
	}

	isChangedAny = (...keys) => {
		if (this.changed) {
			if (keys.length > 0) {
				if (keys[0] instanceof Array) {
					keys = keys[0];
				}
				for (let i = 0; i < keys.length; i++) {
					if (this.changed[keys[i]]) {
						return true;
					}
				}
				return false;
			}
			return true;
		}
		return false;
	}

	isChangedAll = (...keys) => {
		if (this.changed) {
			if (keys.length > 0) {
				if (keys[0] instanceof Array) {
					keys = keys[0];
				}
				for (let i = 0; i < keys.length; i++) {
					if (!this.changed[keys[i]]) {
						return false;
					}
				}
				return true;
			}
			let propsCount = 0;
			if (typeof this.propsList == 'string') {
				propsCount = 1;
			} else if (this.propsList instanceof Array) {
				propsCount = this.propsList.length;
			}
			const {length} = Object.keys(this.changed);
			return length && length >= propsCount;
		}
		return false;
	}

	addIfChanged = (key, value = undefined) => {
		if (this.isChanged(key)) {
			this.add(key, value);
		}
	}

	add = (key, value = undefined) => {
		if (value === undefined) {
			if (key instanceof Object) {
				return this.merge(key);
			}
			value = this.props[key];
		}
		this.newState = modObject(key, value, this.newState);
	}

	merge = (obj) => {
		if (this.newState == null) {
			this.newState = obj;
		} else if (obj instanceof Object) {
			this.newState = this.newState || {};
			for (let k in obj) {
				if (k == 'prevProps') {
					this.newState.prevProps = {
						...obj[k],
						...this.newState.prevProps
					}
 				} else {
					this.newState[k] = obj[k];
				}
			}
		}
	}

	get = () => {
		return this.newState;
	}

	call = (callback) => {
		setTimeout(callback, 0);
	}
}

export const withStateMaster = (component, propsList, initialState) => {
	if (typeof component.makeDerivedStateFromProps == 'function') {
		const stateMaster = new StateMaster(propsList, initialState);
		component.getDerivedStateFromProps = (props, state) => {			
			return stateMaster.getDerivedState(props, state, component.makeDerivedStateFromProps);
		}
	}
	return component;
}