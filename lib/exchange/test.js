if(product){
            console.log("product:::::",product)
               let productNoIsExsist = function(productNo) {
             var counts = [];
             for(var i = 0; i <= productNo.length; i++) {
               if(counts[productNo[i]] === undefined) {
             counts[productNo[i]] = 1;
              } else {
                return true;
                  }
              }
              return false;
          }
           // if(err)
              console.log("duplication err :::::::",err)
              //return resHndlr.apiResponder(req, res, "Product No is allready exsist", 500, err)
            
         
          }