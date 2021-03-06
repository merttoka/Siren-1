import React from 'react';
import { inject, observer } from 'mobx-react';

// CSS Imports
// import _ from 'lodash';
import '../styles/App.css';
import '../styles/Home.css';
import '../styles/Layout.css';
import { executionCssByEvent } from '../keyFunctions';

@inject('globalStore','channelStore')
@observer
export default class Globals extends React.Component {

  handleUpdatePatterns = (event) => {
    if(event.ctrlKey && event.keyCode === 13){
      executionCssByEvent(event);
      this.props.globalStore.updatePatterns();
    }
  }

  handleUpdateGlobals = (globalObj, index) => {
    this.props.globalStore.updateGlobals(globalObj, index); 
  }

  handleSaveGlobals = () => {
    this.props.globalStore.saveGlobals(); 
  }

  
  render() {
    console.log("RENDER GLOBALS.JS");
  
    //{_.map(this.props.channelStore.getActiveChannels, this.renderGlobalChanels.bind(this))}
    
  return (<div className={'GlobalParams PanelAdjuster'}>
    <p>Execute: ⌃ + Enter</p>
    <div className={"GlobalParamsInputsII"}>
      <div className={"GlobalParamsInputs"}>
        <div>
          <input ref={(global_channels) => { this.globalChannels = global_channels; }}
            className={"Input draggableCancel global_input"} 
  
            value={this.props.globalStore.getChannels}
            onChange={() => (this.props.globalStore.updateChannels(this.globalChannels.value))}
            onClick={() =>  this.globalChannels.focus()} 
            onKeyUp={this.handleUpdatePatterns.bind(this)} 
            placeholder={"Channels"}/>

          <input ref={(global_transformer) => { this.globalTransformer = global_transformer; }}
            className={"Input draggableCancel global_input"} 
            value={this.props.globalStore.getTransform}
            onChange={() => (this.props.globalStore.updateTransformer(this.globalTransformer.value))}
            onClick={() =>  this.globalTransformer.focus()} 
            onKeyUp={this.handleUpdatePatterns.bind(this)}
            placeholder={"Transformer"}/>
          <input ref={(global_modifier) => { this.globalModifier = global_modifier; }}
            className={"Input draggableCancel global_input"} 
            value={this.props.globalStore.getModifier}
            onChange={() => (this.props.globalStore.updateModifier(this.globalModifier.value))}
            onClick={() =>  this.globalModifier.focus()} 
            onKeyUp={this.handleUpdatePatterns.bind(this)}
            placeholder={"Modifier"}/>
          <input ref={(global_param) => { this.globalParam = global_param; }}
            className={"Input draggableCancel global_input"} 
            placeholder={"Global Param to be used within patterns"}  
            value={this.props.globalStore.getParam}
            onChange={() => (this.props.globalStore.updateParam(this.globalParam.value))}
            onClick={() =>  this.globalParam.focus()} 
            onKeyUp={this.handleUpdatePatterns.bind(this)}/>
        </div>
        
        <button className={"Button draggableCancel"} onClick={this.handleSaveGlobals.bind(this)}>Save</button>
      </div>
    </div>
    <p>{"(Select) click,  (save) ⇧ + click, (delete) ⌥ + click"}</p>
    <div className={'StoredGlobalParams'}>
      {this.props.globalStore.getGlobals.map((glb, i) => {
        return (<button key={i} 
          className={"Button"+ (this.props.globalStore.isActive(i) ? " active" : "") +" draggableCancel"} 
          onClick={this.handleUpdateGlobals.bind(this, glb, i)}>
            {i}
        </button>)  
      })}
    </div>
    </div>)
  }
}      