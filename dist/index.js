import { reduxForm } from 'redux-form';
import { bindActionCreators } from 'redux';

//#region reducer
const initialState = {};

function hideModal() {
    return {
        icon: '',
        className: '',
        message: '',
        showModal: false
    };
}

function success(state, action) {
    return { ...state, status: hideModal() };
}

function proccess(state, action) {

    return {
        ...state, status: {
            icon: 'fa fa-cog fa-2x fa-spin fa-fw',
            className: 'alert-info',
            message: (action.payload && action.payload.message) ?
                action.payload.message : 'Processando, aguarde.',
            showModal: true
        }
    };
}

function failed(state, action) {
    let retorno = { ...state };
    try {
        const jsonError = JSON.parse(action.payload.message);
        retorno = {
            ...state, status: {
                icon: 'fa fa-close fa-2x',
                className: 'alert-danger',
                message: (jsonError && jsonError.message) ?
                    jsonError.message : 'Erro na solicitação. Consulte o log para detalhes.',
                autohide: true,
                showModal: true
            }
        };
    } catch (error) {
        let mensagem;
        if (action.payload && action.payload.message) {
            mensagem = (action.payload.message === 'Failed to fetch') ?
                'Falha na conexão' : action.payload.message;
        } else {
            mensagem = 'Erro na solicitação. Consulte o log para detalhes.';
        }

        retorno = {
            ...state, status: {
                icon: 'fa fa-close fa-2x',
                className: 'alert-danger',
                message: mensagem,
                autohide: true,
                showModal: true
            }
        };
    }

    return retorno;
}

export function genericReducer(state = initialState, action) {
    switch (action.type) {
        case 'set_value':
            const values = {};
            values[action.payload.key] = action.payload.value;
            if (action.payload.treatment) {
                values[action.payload.key] = action.payload.treatment(action.payload.value, state, action);
            }
            return { ...state, ...values };
        case 'clear_values':
            return initialState;
        case 'fetch_process':
            return proccess(state, action);
        case 'fetch_failed':
            return failed(state, action);
        case 'fetch_success':
            return success(state, action);
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

const request = (method, api, endpoint, returnReduceKey, param, treatment, callback) => (
    [
        { type: 'fetch_process' },
        {
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
        }
    ]);

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
const selects = reducerKeys => state => {
    let reducers = {};
    reducerKeys.forEach(key => reducers[key] = state.reducers[key]);
    return reducers;
};

export function bindDefault(connect) {
    return (...reducerKeys) => {
        const selectDispatch = dispatch => bindActionCreators({ ...Actions }, dispatch);
        return (formComponent) => connect(selects(reducerKeys), selectDispatch)(formComponent);
    };
}

export function bindWithActions(connect) {
    return (...reducerKeys) => {
        return (...actions) => {
            const selectDispatch = dispatch => bindActionCreators({ ...Actions, ...actions }, dispatch);
            return (formComponent) => connect(selects(reducerKeys), selectDispatch)(formComponent);
        }
    };
}

export function bindReduxForm(connect) {
    return (...reducerKeys) => {
        return (...actions) => {
            let _actions = {};
            actions.forEach(action => _actions[JSON.stringify(_actions) === "{}" ? 'onSubmit' : action.name] = action);
            const selectDispatch = dispatch => {
                _actions = { ..._actions, ...Actions };
                bindActionCreators(_actions, dispatch);
            };
            return (validate = undefined, warns = undefined) => {
                return (formComponent) => {
                    const form = `${formComponent.name.toLowerCase()}Form`;
                    const createReduxForm = reduxForm({
                        form,
                        validate,
                        warns
                    });
                    formComponent = createReduxForm(formComponent);
                    return connect(selects(reducerKeys), selectDispatch)(formComponent);
                };
            };
        }
    };
}
//#endregion

//#region sagas
export const SAGA_REQUEST = 'request';
//#endregion

