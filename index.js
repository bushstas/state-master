const UNIQUE_ID = 'UniqueCmpIDn';
const CONTEXTS = {};
let ID = 0;

class StateMaster {
	constructor(propsList, initialState, parent, callback) {
		this.propsList = propsList;
		this.initialState = initialState;
		this.parent = typeof parent == 'function' && typeof parent.getDerivedStateFromProps == 'function' ? parent : null;
		this.callback = callback;
	}

	getDerivedState = (props, state) => {
		this.id = state[UNIQUE_ID];
		this.prevProps = state.prevProps || {};
		this.props = props;
		this.newState = null;
		this.changed = null;
		this.changedProps = [];
		const isInitial = this.id == null;
		if (isInitial && !state.initialId) {
			this.id = ID++;
			this.newState = {[UNIQUE_ID]: this.id};
			if (this.initialState instanceof Object) {
				this.newState = {
					...this.initialState,
					...this.newState
				};
			}
		}
		this.id = this.id || state.initialId;
		const instance = CONTEXTS[this.id];
		this.check(this.propsList);
		let parentalState;
		if (this.parent) {
			const s = isInitial ? {initialId: this.id} : state;
			parentalState = this.parent.getDerivedStateFromProps(props, s);
		}
		const changed = !!this.changed;
		if (changed || parentalState || isInitial) {
			const data = {
				nextProps: props,
				prevProps: this.prevProps,
				state,
				changed,
				changedProps: this.changedProps,
				isInitial,
				add: this.add,
				addIfChanged: this.addIfChanged,
				isChanged: this.isChanged,
				isChangedAny: this.isChangedAny,
				addIfChangedAny: this.addIfChangedAny,
				isChangedAll: this.isChangedAll,
				get: this.get,
				call: this.call
			}
			if (parentalState) {
				this.merge(parentalState);
			}
			const newState = this.callback.call(instance, data);
			if (newState) {
				this.merge(newState);
			}			
			if (changed) {				
				this.newState = this.newState || {};
				if (!this.newState.prevProps) {
					this.newState.prevProps = this.prevProps;
				}
				for (let k in this.changed) {
					this.newState.prevProps[k] = this.props[k];
				}
			}
			return this.newState;
		}
		return null;
	}

	check = (key) => {
		if (typeof key == 'string') {
			const isChanged = this.prevProps[key] !== this.props[key];
			if (isChanged) {
				this.changed = this.changed || {};
				this.changed[key] = true;
				this.changedProps.push(key);
			}
			return isChanged;
		} else if (key instanceof Array) {
			let isChanged = false;
			for (let i = 0; i < key.length; i++) {
				if (this.check(key[i])) {
					isChanged = true
				}
			}
			return isChanged;
		}
	}

	isChanged = (key, value = undefined) => {
		return this.changed && this.changed[key] && (value === undefined || this.props[key] === value);
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
		this.newState = this.newState || {};
		this.addParam(key, value);
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
					this.addParam(k, obj[k]);
				}
			}
		}
	}

	addParam = (key, value) => {
		if (this.newState[key] instanceof Object && value instanceof Object) {
			this.newState[key] = {
				...this.newState[key],
				...value
			};
		} else {
			this.newState[key] = value;
		}
	}

	get = () => {
		return this.newState;
	}

	call = (callback) => {
		setTimeout(callback, 0);
	}
}

const nullFunc = () => null;

export const withStateMaster = (component, propsList, initialState = null, parent = null) => {
	let originalGetDerivedState = component.getDerivedStateFromProps;
	const {prototype} = component;
	const validPropsList = propsList && ((propsList instanceof Array && propsList.length > 0) || typeof propsList == 'string');
	
	if (validPropsList) {
		const {__proto__: p} = prototype;
		if (p && p.constructor.getDerivedStateFromProps === originalGetDerivedState) {
			originalGetDerivedState = nullFunc;
		}
		const stateMaster = new StateMaster(propsList, initialState, parent, originalGetDerivedState);		
		if (typeof originalGetDerivedState != 'function') {
			originalGetDerivedState = nullFunc;
		}
		component.getDerivedStateFromProps = (props, state) => {
			return stateMaster.getDerivedState(props, state || {});
		}
	}
	return component;
}

export const registerContext = (context) => {
	CONTEXTS[ID] = context;
	context.state = context.state || {};
}

export const unregisterContext = (context) => {
	const id = context.state[UNIQUE_ID];
	CONTEXTS[id] = null;
	delete CONTEXTS[id];
}