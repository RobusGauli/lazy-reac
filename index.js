import React, { Component } from 'react';

const withLazyLoad = configObject => {
  if (!configObject.lazyComponent) {
    throw new Error('Must require lazycomponent');
  }

  if (typeof configObject.lazyComponent !== 'function') {
    throw new Error('Lazy component must be a function that returns promise.');
  }
  const defaultLoadingComponent = () => {
    return <div>Please Wait...</div>;
  };
  const { lazyComponent, loadingComponent = defaultLoadingComponent } = configObject;

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
      errorLoading: false,
      renderLoader: false
    };

    constructor(props) {
      super(props);
      // initiate promise
      start();
    }

    componentWillMount() {

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

      this.timer = setTimeout(() => {
        this.setState({
          renderLoader: true
        });
      }, 100);
    }

    render() {
      const { 
        isLoading, 
        loadedComponent: LoadedComponent,
        errorLoading,
        renderLoader
      } = this.state;

      if (isLoading && renderLoader) {
        return loadingComponent();
      }
      if ((isLoading && !renderLoader) || (!isLoading && errorLoading)) {
        return null;
      }

      return <LoadedComponent {...this.props} />;
    }
  };
};

withLazyLoad.awaitOn = function(func) {
  return withLazyLoad({
    lazyComponent: func
  });
};

export default withLazyLoad;
