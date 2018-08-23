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

const savePrevProp = function(key, initial = false) {
	if (!this.newState) {
		this.newState = {};
	}
	if (!this.newState.prevProps) {
		this.newState.prevProps = this.prevProps;
	}
	this.newState.prevProps[key] = this.props[key];
	if (!initial) {
		this.changed = this.changed || {};
		this.changed[key] = true;
	}
}

export class StateMaster {
	constructor(propsList) {
		this.propsList = propsList;
	}

	getInitialState = (props, state = null) => {
		if (typeof this.propsList != 'string' && !(this.propsList instanceof Array)) {
			return {};
		}
		if (state && state instanceof Object) {
			this.newState = state;
		} else {
			this.newState = null;
		}
		this.props = props;
		this.prevProps = {};
		if (this.propsList instanceof Array) {
			for (let i = 0; i < this.propsList.length; i++) {
				savePrevProp.call(this, this.propsList[i], true);
			}
		} else if (typeof this.propsList == 'string') {
			savePrevProp.call(this, this.propsList, true);
		}
		return this.newState;
	}

	getDerivedState = (props, state, callback) => {
		if (typeof this.propsList != 'string' && !(this.propsList instanceof Array)) {
			return null;
		}
		this.props = props;
		this.prevProps = state.prevProps || {};
		this.newState = null;
		this.changed = null;
		check.call(this, this.propsList);
		if (this.changed && typeof callback == 'function') {
			callback(props, this.prevProps, state);
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

	isChangedAny = (keys) => {
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

	isChangedAll = (keys) => {
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

	add = (key, value) => {
		this.newState = modObject(key, value, this.newState);
	}

	merge = (obj) => {
		if (this.newState == null) {
			this.newState = obj;
		} else {
			this.newState = {
				...this.newState,
				...obj
			};
		}
	}

	get = () => {
		return this.newState;
	}
}