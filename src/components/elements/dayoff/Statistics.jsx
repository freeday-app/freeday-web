import React from 'react';

import Lang from '../../../utils/language';



const Statistics = (props) => {
    

    const {
        daysoff,
        onEdit,
        onRefresh
    } = props;

    

    function sum(daysoff){
        let s =0;
        for(const dayoff of daysoff){
            s+=dayoff.count;
        }
        return s;
    }

    return (
        <div id='dayoff-statistics'>
                {daysoff.length > 0
                ? Lang.text("dayoff.statistics.average")+" : "
                +sum(daysoff) / daysoff.length 
                : <i>{Lang.text("dayoff.statistics.average")+" : "+0}</i>}
        </div>   
    );
};

export default Statistics;
