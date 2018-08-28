const UNIQUE_ID = 'UniqueCmpIDn';
const CONTEXTS = {};
let ID = 0;

class StateMaster {
	constructor(propsList, initialState, parent) {
		this.propsList = propsList;
		this.initialState = initialState;
		this.parent = typeof parent == 'function' && typeof parent.getDerivedStateFromProps == 'function' ? parent : null;
	}

	getDerivedState = (props, state, callback) => {
		this.prevProps = state.prevProps || {};
		this.props = props;
		this.newState = null;
		this.changed = null;
		this.id = state[UNIQUE_ID];
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
			parentalState = this.parent.getDerivedStateFromProps(props, isInitial ? {initialId: this.id} : state);
		}
		const changed = !!this.changed;
		if (changed || parentalState || isInitial) {
			const data = {
				nextProps: props,
				prevProps: this.prevProps,
				state,
				changed,
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
			const newState = callback.call(instance, data);
			if (newState) {
				this.merge(newState);
			}
			if (parentalState) {
				this.merge(parentalState);
			}
			if (changed) {
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
			const isChanged = this.isPropChanged(key);
			if (isChanged) {
				this.savePrevProp(key);
			}
			return isChanged;
		} else if (key instanceof Array) {
			let isChanged = false;
			for (let i = 0; i < key.length; i++) {
				if (this.check(key[i])) {
					this.savePrevProp(key[i]);
					isChanged = true
				}
			}
			return isChanged;
		}
	}
	
	savePrevProp = (key) => {
		if (!this.newState) {
			this.newState = {};
		}
		this.changed = this.changed || {};
		this.changed[key] = true;
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

export const withStateMaster = (component, propsList, initialState = null, parent = null) => {
	const originalGetDerivedState = component.getDerivedStateFromProps;
	if (typeof originalGetDerivedState == 'function') {		
		const stateMaster = new StateMaster(propsList, initialState, parent);
		component.getDerivedStateFromProps = (props, state) => {
			return stateMaster.getDerivedState(props, state, originalGetDerivedState);
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