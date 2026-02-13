    
    function onEntry(entries,index) {
        entries.forEach(function (entry,index) {
            if (entry.isIntersecting === true) {
                    setTimeout(function(){
                       entry.target.classList.add("is-showing"); 
                    },150*(index+1));
            } else {
                entry.target.classList.remove("is-showing");
            }
        });
    }

    var options = {};
    var observer = new IntersectionObserver(onEntry, options);
    var items = document.querySelectorAll(".stagger-item");
    
    items.forEach(function (item,index) {
        observer.observe(item);
    });


    function onEntry2(entries,index) {
        entries.forEach(function (entry,index) {
            if (entry.isIntersecting === true) {
                       entry.target.classList.add("is-showing"); 
            } else {
                entry.target.classList.remove("is-showing");
            }
        });
    }

    var options2 = {};
    
    var observer2 = new IntersectionObserver(onEntry2, options2);

    var items2 = document.querySelectorAll(".fade-item");
    
    items2.forEach(function (item,index) {
        observer2.observe(item);
    });