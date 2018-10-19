define([

], function (

) {

    return function install(openmct) {
        let navigateCall = 0;
        let browseObject;
        let removeSelectable = undefined;


        function viewObject(object, viewProvider) {
            if (removeSelectable) {
                removeSelectable();
                removeSelectable = undefined;
            }
            openmct.layout.$refs.browseObject.show(object, viewProvider.key);
            openmct.layout.$refs.browseBar.domainObject = object;
            openmct.layout.$refs.browseBar.viewKey = viewProvider.key;
            removeSelectable = openmct.selection.selectable(
                openmct.layout.$refs.browseObject.$el,
                {
                    item: object
                },
                true
            );
        };

        function navigateToPath(path, currentViewKey) {
            navigateCall++;
            let currentNavigation = navigateCall;

            if (!Array.isArray(path)) {
                path = path.split('/');
            }
            return openmct.objects.get(path[path.length - 1]).then((navigatedObject)=>{
                if (currentNavigation !== navigateCall) {
                    return; // Prevent race.
                }

                openmct.layout.$refs.browseBar.domainObject = navigatedObject;
                browseObject = navigatedObject;
                if (!navigatedObject) {
                    openmct.layout.$refs.browseObject.clear();
                    return;
                }
                let currentProvider = openmct
                    .objectViews
                    .getByProviderKey(currentViewKey)

                if (currentProvider && currentProvider.canView(navigatedObject)) {
                    viewObject(navigatedObject,  currentProvider);
                    return;
                }

                let defaultProvider = openmct.objectViews.get(navigatedObject)[0];
                if (defaultProvider) {
                    openmct.router.updateParams({
                        view: defaultProvider.key
                    });
                } else {
                    openmct.router.updateParams({
                        view: undefined
                    });
                    openmct.layout.$refs.browseObject.clear();
                }
            });
        }

        openmct.router.route(/^\/browse\/(.*)$/, (path, results, params) => {
            let navigatePath = results[1];
            if (!navigatePath) {
                navigatePath = 'mine';
            }
            navigateToPath(navigatePath, params.view);
        });

        openmct.router.on('change:params', function (newParams, oldParams, changed) {
            if (changed.view && browseObject) {
                let provider = openmct
                    .objectViews
                    .getByProviderKey(changed.view);
                viewObject(browseObject, provider);
            }
        });

    }

});
