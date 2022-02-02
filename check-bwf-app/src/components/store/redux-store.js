import {applyMiddleware, combineReducers, createStore} from "redux";
import thunk from "redux-thunk";
import mainReducer from "../reducers/main-reducer";

let reducers =
    combineReducers({
        main: mainReducer
    });

const store = createStore(reducers, applyMiddleware(thunk));

window.store = store;

export default store;