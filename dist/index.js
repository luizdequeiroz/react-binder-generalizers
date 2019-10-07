import { reduxForm, formValueSelector } from 'redux-form';
import { bindActionCreators } from 'redux';

//#region reducer
const initialState = {};

export function genericReducer(state = initialState, action) {
    switch (action.type) {
        case 'set_value':
            const values = {};
            values[action.payload.key] = action.payload.value;
            if (action.payload.treatment) {
                values[action.payload.key] = action.payload.treatment(action.payload.value, state, action);
            }
            return {...state, ...values };
        case 'clear_values':
            return initialState;
        default:
            return state;
    }
}
//#endregion

//#region actions
export function setValue(key, value) {
    return {
        type: 'set_value',
        payload: { key, value }
    };
}

export function clearValues() {
    return { type: 'clear_values' };
}

const request = (method, api, endpoint, returnReduceKey, param, treatment, callback) => ({
    type: 'request',
    request: {
        method,
        api,
        endpoint,
        returnReduceKey,
        param,
        treatment,
        callback
    }
});

export function post(api, endpoint, returnReduceKey, { param, treatment, callback } = {}) {
    return request('POST', api, endpoint, returnReduceKey, param, treatment, callback)
}

export function put(api, endpoint, returnReduceKey, { param, treatment, callback } = {}) {
    return request('PUT', api, endpoint, returnReduceKey, param, treatment, callback)
}

export function get(api, endpoint, returnReduceKey, { treatment, callback } = {}) {
    return request('GET', api, endpoint, returnReduceKey, undefined, treatment, callback)
}

export function del(api, endpoint, returnReduceKey, { treatment, callback } = {}) {
    return request('DELETE', api, endpoint, returnReduceKey, undefined, treatment, callback)
}

export function dispatch({ type, payload }) {
    return { type, payload };
}

const Actions = {
    setValue,
    clearValues,
    post,
    put,
    get,
    del,
    dispatch
};
//#endregion

//#region binders
const selects = (reducerKeys, form, formValues) => state => {
    let reducers = { formValues: {} };
    if (formValues) formValues.forEach(formValue => reducers.formValues[formValue] = form && formValueSelector(form)(state, formValue));
    reducerKeys.forEach(key => reducers[key] = state.reducers[key]);
    return reducers;
};

export function bindDefault(connect) {
    return (...reducerKeys) => {
        const selectDispatch = dispatch => bindActionCreators({...Actions }, dispatch);
        return (formComponent) => connect(selects(reducerKeys), selectDispatch)(formComponent);
    };
}

export function bindWithActions(connect) {
    return (...reducerKeys) => {
        return (...actions) => {
            const selectDispatch = dispatch => bindActionCreators({...Actions, ...actions }, dispatch);
            return (formComponent) => connect(selects(reducerKeys), selectDispatch)(formComponent);
        }
    };
}

export function bindReduxForm(connect) {
    return (...reducerKeys) => {
        return (...actions) => {
            let _actions = {};
            actions.forEach(action => _actions[JSON.stringify(_actions) === "{}" ? 'onSubmit' : action.name] = action);
            _actions = {..._actions, ...Actions };
            const selectDispatch = dispatch => bindActionCreators(_actions, dispatch);

            return (validate = undefined, warns = undefined) => {
                return (formComponent, ...formValues) => {
                    const form = `${formComponent.name.toLowerCase()}Form`;
                    const createReduxForm = reduxForm({
                        form,
                        validate,
                        warns
                    });
                    formComponent = createReduxForm(formComponent);
                    return connect(selects(reducerKeys, form, formValues), selectDispatch)(formComponent);
                };
            };
        }
    };
}
//#endregion

//#region sagas
export const SAGA_REQUEST = 'request';
//#endregion