package me.andreaseriksson.pelletstracker.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.WritingConverter;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Date;

@WritingConverter
public final class LocalDateToDateConverter implements Converter<LocalDate, Date> {
    @Override
    public Date convert(LocalDate source) {
        if (source == null) return null;
        return Date.from(source.atStartOfDay(ZoneOffset.UTC).toInstant());
    }
}