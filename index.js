import React, { Component } from 'react';

const withLazyLoad = configObject => {
  if (!configObject.lazyComponent) {
    throw new Error('Must require lazycomponent');
  }

  if (typeof configObject.lazyComponent !== 'function') {
    throw new Error('Lazy component must be a function that returns promise');
  }

  const { lazyComponent } = configObject;

  const promiseModule = () => lazyComponent();

  const setup = () => {
    let closureState = {
      isLoading: true,
      errorLoading: false,
      loadedComponent: null
    };

    closureState.promise = promiseModule()
      .then(module => module.default)
      .then(loadedComponent => {
        closureState.isLoading = false;
        closureState.loadedComponent = loadedComponent;
        
        return loadedComponent;
      })
      .catch(error => {
        closureState.isLoading = false;
        closureState.errorLoading = true;
        throw error;
      });
    
    return closureState;  
  };
  
  let result = null;
  
  const start = () => {
    if (!result) {
      result = setup();
    }
    
    return result.promise;
  };
  
  return class LazyComponent extends Component {
    
    state = {
      isLoading: true,
      loadedComponent: null,
      errorLoading: false
    }

    constructor(props) {
      super(props);
      // promise is launched
      start();
    }

    componentWillMount() {
      // here we load the module during runtime
      const promise = start();

      promise
        .then(() => {
          this.setState({
            loadedComponent: result.loadedComponent,
            isLoading: false
          });
        })
        .catch(error => {
          this.setState({
            errorLoading: true,
            isLoading: false
          });
        });
    }

    render() {
      const { isLoading, loadedComponent: LoadedComponent, errorLoading } = this.state;

      if (isLoading) {
        return <div> Component Loading </div>;
      }
      if (!isLoading && errorLoading) {
        return null;
      }
      
      return <LoadedComponent {...this.props} />;
    }
  };
};

export default withLazyLoad;
