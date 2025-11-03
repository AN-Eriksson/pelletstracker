package me.andreaseriksson.pelletstracker.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Date;

@ReadingConverter
public final class DateToLocalDateConverter implements Converter<Date, LocalDate> {
    @Override
    public LocalDate convert(Date source) {
        if (source == null) return null;
        return source.toInstant().atZone(ZoneOffset.UTC).toLocalDate();
    }
}