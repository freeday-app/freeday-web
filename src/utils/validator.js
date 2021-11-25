import DayJS from 'dayjs';

const Validator = {
    year(year) {
        return (DayJS().year() - 10 <= year) && (year <= DayJS().year() + 10);
    },

    date(date) {
        return (
            date === null
            || (
                DayJS(date).isValid()
                && (DayJS().subtract(5, 'years').startOf('year') < DayJS(date))
                && (DayJS(date) < DayJS().add(5, 'years').endOf('year'))
            )
        );
    },

    validateFilter(filter) {
        const { start, end, year } = filter;
        if (start && end) {
            return Validator.date(start) && Validator.date(end);
        }
        if (start) {
            return Validator.date(start);
        }
        if (end) {
            return Validator.date(end);
        }
        if (year) {
            return Validator.year(year);
        }
        return false;
    }
};

export default Validator;
