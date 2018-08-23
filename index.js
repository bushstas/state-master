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

const SUBSCRIBERS = {};
let ID = 0;
let CURRENT_ID = 0;
const getNextId = function() {
	return ID++;
}

export class StateMaster {
	constructor(propsList) {
		this.propsList = propsList;
	}

	subscribe(cmp) {
		CURRENT_ID = getNextId();
		SUBSCRIBERS[CURRENT_ID] = cmp;
	}

	unsubscribe(cmp) {
		const {uniqCmpID} = cmp.state;
		SUBSCRIBERS[uniqCmpID] = null;
		delete SUBSCRIBERS[uniqCmpID];
	}

	getDerivedState = (props, state, callback, parent) => {
		this.props = props;
		this.prevProps = state.prevProps || {};
		this.newState = null;
		this.changed = null;
		if (!state || state.uniqCmpID == null) {
			this.changed = {uniqCmpID: true};
			this.newState = {uniqCmpID: CURRENT_ID};
			this.id = CURRENT_ID;
		} else {
			this.id = state.uniqCmpID;
		}
		check.call(this, this.propsList);
		let parentalState;
		if (parent instanceof Function && parent.getDerivedStateFromProps instanceof Function) {
			parentalState = parent.getDerivedStateFromProps(props, state);
		}
		if ((this.changed || parentalState) && typeof callback == 'function') {
			callback(props, this.prevProps, state, SUBSCRIBERS[this.id]);
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

	isChangedAny = (keys = this.propsList) => {
		if (this.changed) {
			if (keys instanceof Array) {
				for (let i = 0; i < keys.length; i++) {
					if (this.changed[keys[i]]) {
						return true;
					}
				}
				return false;
			}
			return this.isChanged(keys);
		}
		return false;
	}

	isChangedAll = (keys = this.propsList) => {
		if (this.changed) {
			if (keys instanceof Array) {
				for (let i = 0; i < keys.length; i++) {
					if (!this.changed[keys[i]]) {
						return false;
					}
				}
				return true;
			}
			return this.isChanged(keys);
		}
		return false;
	}

	add = (key, value = undefined) => {
		if (value === undefined) {
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
}